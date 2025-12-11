import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalAzureAccounts } from '../hooks/useLocalAzureAccounts';
import { useToast } from '../hooks/useToast';
import { debounce } from '../utils/common';

import { MasterModelDirectory } from './Dashboard/MasterModelDirectory';
import { OverviewDashboard } from './Dashboard/OverviewDashboard';
import { RegionCoverageChart } from './Dashboard/CoverageCharts/RegionCoverageChart';
import { ModelCoverageChart, StatusFilter } from './Dashboard/CoverageCharts/ModelCoverageChart';
import { ModelOverviewTable, ModelState } from './Dashboard/ModelOverviewTable';
import { ModelStatisticsTable } from './Dashboard/ModelStatisticsTable';
import { AccountsSection } from './Dashboard/AccountConfiguration/AccountsSection';
import { GlobalSummary } from './Dashboard/Summary/GlobalSummary';
import { TableDetailDialog } from './ui/TableDetailDialog';

const MASTER_STORAGE_KEY = 'azure-openai-manager:master-models';

const parseModels = (text: string): string[] => {
  if (!text) return [];
  const parts = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

export interface AzureModelsDashboardProps {
  privacyMode?: boolean;
}

export const AzureModelsDashboard: React.FC<AzureModelsDashboardProps> = ({ privacyMode = false }) => {
  const { t } = useTranslation();
  const toast = useToast();

  const {
    accounts,
    accountSummaries,
    globalSeriesSummary,
    addAccount,
    updateAccountName,
    updateAccountNote,
    updateAccountEnabled,
    updateAccountIncludeInStats,
    updateAccountTier,
    updateAccountQuota,
    updateAccountPurchase,
    updateAccountUsedAmount,
    deleteAccount,
    addRegion,
    updateRegionName,
    updateRegionModelsText,
    deleteRegion,
    updateRegionOpenaiEndpoint,
    updateRegionAnthropicEndpoint,
    updateRegionApiKey,
    updateRegionEnabled,
    reorderAccounts,
    reorderRegions,
  } = useLocalAzureAccounts();

  // Master models state
  const [masterText, setMasterText] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(MASTER_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(MASTER_STORAGE_KEY, masterText);
    } catch {
      // ignore
    }
  }, [masterText]);

  // Filter state with debounce
  const [modelFilterInput, setModelFilterInput] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // 详情弹窗状态
  const [accountDetailOpen, setAccountDetailOpen] = useState(false);
  const [modelDetailOpen, setModelDetailOpen] = useState(false);

  const debouncedSetFilter = useMemo(
    () => debounce((value: string) => setModelFilter(value), 300),
    []
  );

  const handleFilterChange = useCallback((value: string) => {
    setModelFilterInput(value);
    debouncedSetFilter(value);
  }, [debouncedSetFilter]);

  // Computed values
  const masterModels = useMemo(() => parseModels(masterText).sort(), [masterText]);

  const filteredModels = useMemo(() => {
    const keyword = modelFilter.trim().toLowerCase();
    if (!keyword) return masterModels;
    return masterModels.filter((m) => m.toLowerCase().includes(keyword));
  }, [masterModels, modelFilter]);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.enabled !== false),
    [accounts]
  );

  const allRegions = useMemo(
    () =>
      activeAccounts.flatMap((acct) =>
        acct.regions
          .filter((reg) => reg.enabled !== false)  // 只统计启用的区域
          .map((reg) => ({
            accountId: acct.id,
            accountName: acct.name,
            regionId: reg.id,
            regionName: reg.name,
            models: parseModels(reg.modelsText),
          }))
      ),
    [activeAccounts]
  );

  const totalAccounts = activeAccounts.length;
  const totalRegions = allRegions.length;
  const regionsWithModels = allRegions.filter((r) => r.models.length > 0).length;
  const totalMasterModels = masterModels.length;
  const totalUsedModels = globalSeriesSummary.allModels.length;
  const avgModelsPerRegion =
    totalRegions === 0
      ? 0
      : Math.round(
          (allRegions.reduce((sum, r) => sum + r.models.length, 0) / totalRegions) * 10
        ) / 10;

  const regionCoverage = useMemo(() => {
    if (totalMasterModels === 0) return [];
    const masterSet = new Set(masterModels);

    // 获取每个账号的 tier
    const accountTierMap = new Map<string, 'premium' | 'standard'>();
    accounts.forEach((acc) => {
      accountTierMap.set(acc.id, acc.tier || 'standard');
    });

    return allRegions
      .map((r) => {
        const used = r.models.filter((m) => masterSet.has(m));
        const pct = Math.round((used.length / totalMasterModels) * 100);
        const accountTier = accountTierMap.get(r.accountId) || 'standard';
        return {
          key: `${r.accountId}-${r.regionId}`,
          label: `${r.accountName || r.accountId} / ${r.regionName || t('regions.unnamed')}`,
          usedCount: used.length,
          pct,
          accountId: r.accountId,
          accountTier,
        };
      })
      // 排序：高级账号在前，然后按覆盖度降序
      .sort((a, b) => {
        const aTier = a.accountTier === 'premium' ? 0 : 1;
        const bTier = b.accountTier === 'premium' ? 0 : 1;
        if (aTier !== bTier) return aTier - bTier;
        return b.pct - a.pct;
      });
  }, [allRegions, masterModels, totalMasterModels, accounts, t]);

  const modelCoverage = useMemo(() => {
    if (masterModels.length === 0 || totalRegions === 0) return [];
    const counts: Record<string, number> = {};
    for (const r of allRegions) {
      const set = new Set(r.models);
      for (const m of masterModels) {
        if (set.has(m)) {
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    }
    return masterModels
      .map((m) => {
        const c = counts[m] || 0;
        const pct = Math.round((c / totalRegions) * 100);
        return { model: m, count: c, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [allRegions, masterModels, totalRegions]);

  const unusedModelsCount = totalMasterModels > 0 ? totalMasterModels - totalUsedModels : 0;
  const singleRegionModelsCount = modelCoverage.filter((m) => m.count === 1).length;

  // 计算每个模型部署在哪些账号上 (编号从1开始)
  const modelAccountsMap = useMemo(() => {
    const map = new Map<string, number[]>();
    // 创建账号ID到编号的映射 (只统计启用的账号)
    const accountIndexMap = new Map<string, number>();
    activeAccounts.forEach((acc, idx) => {
      accountIndexMap.set(acc.id, idx + 1);
    });
    // 遍历所有区域，记录每个模型所属的账号编号
    for (const r of allRegions) {
      const accountIndex = accountIndexMap.get(r.accountId);
      if (!accountIndex) continue;
      for (const model of r.models) {
        if (!map.has(model)) {
          map.set(model, []);
        }
        const indices = map.get(model)!;
        if (!indices.includes(accountIndex)) {
          indices.push(accountIndex);
        }
      }
    }
    // 对每个模型的账号编号排序
    map.forEach((indices) => indices.sort((a, b) => a - b));
    return map;
  }, [allRegions, activeAccounts]);

  const modelStates: ModelState[] = useMemo(
    () =>
      modelCoverage.map((item) => ({
        ...item,
        status:
          item.count === 0
            ? 'unused'
            : item.count === 1
              ? 'single'
              : 'multi',
      })),
    [modelCoverage]
  );

  const filteredModelStates = useMemo(() => {
    const keyword = modelFilter.trim().toLowerCase();
    return modelStates.filter((item) => {
      if (statusFilter === 'unused' && item.status !== 'unused') return false;
      if (statusFilter === 'single' && item.status !== 'single') return false;
      if (statusFilter === 'multi' && item.status !== 'multi') return false;
      if (!keyword) return true;
      return item.model.toLowerCase().includes(keyword);
    });
  }, [modelFilter, modelStates, statusFilter]);

  const modelCoverageFiltered = useMemo(
    () =>
      filteredModelStates
        .map(({ model, count, pct }) => ({ model, count, pct }))
        .sort((a, b) => b.pct - a.pct),
    [filteredModelStates]
  );

  // Handlers
  const handleCopy = useCallback((text: string, label: string) => {
    if (!text) return;
    const successMessage = `${t('toast.copied')}: ${label}`;
    if (!navigator.clipboard) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast.success(successMessage);
      } catch {
        toast.error(t('toast.copyFailed'));
      }
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(successMessage))
      .catch(() => toast.error(t('toast.copyFailed')));
  }, [toast, t]);

  const handleExportConfig = useCallback(() => {
    try {
      const payload = JSON.stringify({ accounts, masterText }, null, 2);
      const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'azure-openai-manager-config.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('toast.configExported'));
    } catch {
      toast.error(t('toast.exportFailed'));
    }
  }, [accounts, masterText, toast, t]);

  return (
    <div className="flex flex-col gap-4">
      {/* Global Model Directory */}
      <MasterModelDirectory
        masterText={masterText}
        onMasterTextChange={setMasterText}
        masterModels={masterModels}
        onCopy={handleCopy}
      />

      {/* Overview Dashboard + Coverage Charts */}
      <section className="p-3 sm:p-4 rounded-xl border border-gray-800 bg-background section-glow">
        <h2 className="text-base sm:text-lg font-semibold mb-2">{t('dashboard.title')}</h2>
        {/* 移动端：单列 | 平板：两列 | 桌面：三列 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <OverviewDashboard
            totalAccounts={totalAccounts}
            totalRegions={totalRegions}
            regionsWithModels={regionsWithModels}
            avgModelsPerRegion={avgModelsPerRegion}
            totalMasterModels={totalMasterModels}
            totalUsedModels={totalUsedModels}
            unusedModelsCount={unusedModelsCount}
            singleRegionModelsCount={singleRegionModelsCount}
          />
          <RegionCoverageChart
            regionCoverage={regionCoverage}
            totalMasterModels={totalMasterModels}
            privacyMode={privacyMode}
          />
          <ModelCoverageChart
            modelCoverage={modelCoverageFiltered}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            totalRegions={totalRegions}
          />
        </div>
      </section>

      {/* Model Overview Table */}
      <ModelOverviewTable
        filteredModelStates={filteredModelStates}
        modelStates={modelStates}
        totalRegions={totalRegions}
        accounts={accounts}
        privacyMode={privacyMode}
        onOpenDetail={() => setAccountDetailOpen(true)}
      />

      {/* Model Statistics */}
      <ModelStatisticsTable
        modelStates={modelStates}
        filteredModelStates={filteredModelStates}
        totalRegions={totalRegions}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCopy={handleCopy}
        modelAccountsMap={modelAccountsMap}
        onOpenDetail={() => setModelDetailOpen(true)}
      />

      {/* Account Configuration */}
      <AccountsSection
        accounts={accounts}
        masterModels={masterModels}
        filteredModels={filteredModels}
        modelFilterInput={modelFilterInput}
        privacyMode={privacyMode}
        onFilterChange={handleFilterChange}
        onAddAccount={addAccount}
        onExportConfig={handleExportConfig}
        onUpdateAccountName={updateAccountName}
        onUpdateAccountNote={updateAccountNote}
        onUpdateAccountEnabled={updateAccountEnabled}
        onUpdateAccountIncludeInStats={updateAccountIncludeInStats}
        onUpdateAccountTier={updateAccountTier}
        onUpdateAccountQuota={updateAccountQuota}
        onUpdateAccountPurchase={updateAccountPurchase}
        onUpdateAccountUsedAmount={updateAccountUsedAmount}
        onDeleteAccount={deleteAccount}
        onAddRegion={addRegion}
        onDeleteRegion={deleteRegion}
        onUpdateRegionName={updateRegionName}
        onUpdateRegionModelsText={updateRegionModelsText}
        onUpdateRegionOpenaiEndpoint={updateRegionOpenaiEndpoint}
        onUpdateRegionAnthropicEndpoint={updateRegionAnthropicEndpoint}
        onUpdateRegionApiKey={updateRegionApiKey}
        onUpdateRegionEnabled={updateRegionEnabled}
        onReorderAccounts={reorderAccounts}
        onReorderRegions={reorderRegions}
        onCopy={handleCopy}
      />

      {/* Global Summary */}
      <GlobalSummary
        allModels={globalSeriesSummary.allModels}
        onCopy={handleCopy}
      />

      {/* Account Detail Dialog */}
      <TableDetailDialog
        open={accountDetailOpen}
        onOpenChange={setAccountDetailOpen}
        title={t('statistics.accountOverview')}
        subtitle={t('statistics.accountSummary', {
          total: accounts.length,
          enabled: accounts.filter(a => a.enabled).length,
        })}
      >
        <ModelOverviewTable
          filteredModelStates={filteredModelStates}
          modelStates={modelStates}
          totalRegions={totalRegions}
          accounts={accounts}
          privacyMode={privacyMode}
          isDetailView
        />
      </TableDetailDialog>

      {/* Model Detail Dialog */}
      <TableDetailDialog
        open={modelDetailOpen}
        onOpenChange={setModelDetailOpen}
        title={t('modelStatistics.title')}
        subtitle={t('modelStatistics.summary', {
          total: modelStates.length,
          deployed: modelStates.filter(m => m.status !== 'unused').length,
          unused: modelStates.filter(m => m.status === 'unused').length,
        })}
      >
        <ModelStatisticsTable
          modelStates={modelStates}
          filteredModelStates={filteredModelStates}
          totalRegions={totalRegions}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onCopy={handleCopy}
          modelAccountsMap={modelAccountsMap}
          isDetailView
        />
      </TableDetailDialog>
    </div>
  );
};
