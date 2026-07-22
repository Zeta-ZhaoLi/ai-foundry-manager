import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalAzureAccounts } from '../hooks/useLocalAzureAccounts';
import { useToast } from '../hooks/useToast';
import {
  debounce,
  parseModels,
  parseMasterModelDirectory,
  computeDeployedModels,
  computeModelRegionCounts,
  orderModelsByMaster,
} from '../utils/common';

import { MasterModelDirectory } from './Dashboard/MasterModelDirectory';
import { OverviewDashboard } from './Dashboard/OverviewDashboard';
import { RegionCoverageChart } from './Dashboard/CoverageCharts/RegionCoverageChart';
import {
  ModelCoverageChart,
  StatusFilter,
} from './Dashboard/CoverageCharts/ModelCoverageChart';
import { ModelOverviewTable, ModelState } from './Dashboard/ModelOverviewTable';
import { ModelStatisticsTable } from './Dashboard/ModelStatisticsTable';
import { AccountsSection } from './Dashboard/AccountConfiguration/AccountsSection';
import { TableDetailDialog } from './ui/TableDetailDialog';
import { createConfigEnvelope } from '../persistence/config';

export interface AzureModelsDashboardProps {
  privacyMode?: boolean;
}

export interface ConfigTransferResult {
  success: boolean;
  error?: string;
}

function downloadJson(value: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const AzureModelsDashboard: React.FC<AzureModelsDashboardProps> = ({
  privacyMode = false,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const {
    accounts,
    masterText,
    updateMasterText,
    defaultRegionModelTemplate,
    addAccount,
    updateDefaultRegionModelTemplateEnabled,
    addDefaultRegionModelTemplateRegion,
    deleteDefaultRegionModelTemplateRegion,
    updateDefaultRegionModelTemplateRegionName,
    updateDefaultRegionModelTemplateRegionEnabled,
    updateDefaultRegionModelTemplateRegionModelsText,
    reorderDefaultRegionModelTemplateRegions,
    updateAccountName,
    updateAccountSubscriptionId,
    updateAccountResourceGroupName,
    updateAccountServicePrincipal,
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
    updateRegionFoundryProjectEndpoint,
    updateRegionOpenaiEndpoint,
    updateRegionAiServicesEndpoint,
    updateRegionAnthropicEndpoint,
    updateRegionApiKey,
    updateRegionDeployment,
    applyGeneratedRegionIdentity,
    updateRegionDeploymentModel,
    updateRegionEnabled,
    reorderAccounts,
    reorderRegions,
    renumberAllAccounts,
    importConfig,
    importDeploymentResultText,
  } = useLocalAzureAccounts();

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

  const handleFilterChange = useCallback(
    (value: string) => {
      setModelFilterInput(value);
      debouncedSetFilter(value);
    },
    [debouncedSetFilter]
  );

  // Computed values
  const masterParsed = useMemo(
    () => parseMasterModelDirectory(masterText),
    [masterText]
  );
  const masterModels = masterParsed.allModels;
  const masterGroups = masterParsed.groups;
  const masterGroupLines = masterParsed.groupLines;

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
          .filter((reg) => reg.enabled !== false) // 只统计启用的区域
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

  const deployedModels = useMemo(
    () => computeDeployedModels(allRegions.map((r) => r.models)),
    [allRegions]
  );
  const deployedModelsOrdered = useMemo(
    () => orderModelsByMaster(deployedModels, masterModels),
    [deployedModels, masterModels]
  );
  const deployedRegionCounts = useMemo(
    () => computeModelRegionCounts(allRegions.map((r) => r.models)),
    [allRegions]
  );

  const totalAccounts = activeAccounts.length;
  const totalRegions = allRegions.length;
  const regionsWithModels = allRegions.filter(
    (r) => r.models.length > 0
  ).length;
  const totalMasterModels = masterModels.length;
  const totalUsedModels = deployedModels.length;
  const avgModelsPerRegion =
    totalRegions === 0
      ? 0
      : Math.round(
          (allRegions.reduce((sum, r) => sum + r.models.length, 0) /
            totalRegions) *
            10
        ) / 10;

  const regionCoverage = useMemo(() => {
    if (totalMasterModels === 0) return [];
    const masterSet = new Set(masterModels);

    // 获取每个账号的 tier
    const accountTierMap = new Map<string, 'premium' | 'standard'>();
    accounts.forEach((acc) => {
      accountTierMap.set(acc.id, acc.tier || 'standard');
    });

    return (
      allRegions
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
        })
    );
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

  const unusedModelsCount =
    totalMasterModels > 0 ? totalMasterModels - totalUsedModels : 0;
  const singleRegionModelsCount = modelCoverage.filter(
    (m) => m.count === 1
  ).length;

  // global summary removed

  // 计算每个模型部署在哪些账号上（显示 accountId，如 A017/B030；无 accountId 则回退为原始序号）
  const modelAccountsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    const accountDisplayIdMap = new Map<string, string>();
    accounts.forEach((acc, idx) => {
      if (acc.enabled !== false) {
        const displayId =
          acc.accountId && acc.accountId.trim()
            ? acc.accountId.trim()
            : String(idx + 1);
        accountDisplayIdMap.set(acc.id, displayId);
      }
    });
    // 遍历所有区域，记录每个模型所属账号 ID
    for (const r of allRegions) {
      const displayId = accountDisplayIdMap.get(r.accountId);
      if (!displayId) continue;
      for (const model of r.models) {
        if (!map.has(model)) {
          map.set(model, []);
        }
        const ids = map.get(model)!;
        if (!ids.includes(displayId)) {
          ids.push(displayId);
        }
      }
    }
    // 对每个模型的账号 ID 排序
    map.forEach((ids) => ids.sort((a, b) => a.localeCompare(b)));
    return map;
  }, [allRegions, accounts]);

  const modelStates: ModelState[] = useMemo(
    () =>
      modelCoverage.map((item) => ({
        ...item,
        status:
          item.count === 0 ? 'unused' : item.count === 1 ? 'single' : 'multi',
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
  const handleCopy = useCallback(
    (text: string, label: string) => {
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
    },
    [toast, t]
  );

  const currentConfig = useMemo(
    () => ({
      version: 2 as const,
      accounts,
      masterText,
      defaultRegionModelTemplate,
    }),
    [accounts, defaultRegionModelTemplate, masterText]
  );

  const handleExportConfig = useCallback(() => {
    try {
      downloadJson(
        createConfigEnvelope(currentConfig),
        `ai-foundry-manager-config-${new Date()
          .toISOString()
          .replace(/[:.]/g, '-')}.json`
      );
      toast.success(t('toast.configExported'));
    } catch {
      toast.error(t('toast.exportFailed'));
    }
  }, [currentConfig, toast, t]);

  const handleImportConfig = useCallback(
    (jsonString: string): ConfigTransferResult => importConfig(jsonString),
    [importConfig]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Global Model Directory */}
      <MasterModelDirectory
        masterText={masterText}
        onMasterTextChange={updateMasterText}
        masterGroups={masterGroups}
        masterGroupLines={masterGroupLines}
        masterModels={masterModels}
        deployedModelsOrdered={deployedModelsOrdered}
        deployedRegionCounts={deployedRegionCounts}
        onCopy={handleCopy}
      />

      {/* Overview Dashboard + Coverage Charts */}
      <section className="p-3 sm:p-4 rounded-xl border border-border bg-background section-glow">
        <h2 className="text-base sm:text-lg font-semibold mb-2">
          {t('dashboard.title')}
        </h2>
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
        masterModels={masterModels}
        masterGroups={masterGroups}
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
        defaultRegionModelTemplate={defaultRegionModelTemplate}
        masterGroups={masterGroups}
        masterGroupLines={masterGroupLines}
        masterModels={masterModels}
        filteredModels={filteredModels}
        modelFilterInput={modelFilterInput}
        privacyMode={privacyMode}
        onFilterChange={handleFilterChange}
        onAddAccount={addAccount}
        onUpdateDefaultRegionModelTemplateEnabled={
          updateDefaultRegionModelTemplateEnabled
        }
        onAddDefaultRegionModelTemplateRegion={
          addDefaultRegionModelTemplateRegion
        }
        onDeleteDefaultRegionModelTemplateRegion={
          deleteDefaultRegionModelTemplateRegion
        }
        onUpdateDefaultRegionModelTemplateRegionName={
          updateDefaultRegionModelTemplateRegionName
        }
        onUpdateDefaultRegionModelTemplateRegionEnabled={
          updateDefaultRegionModelTemplateRegionEnabled
        }
        onUpdateDefaultRegionModelTemplateRegionModelsText={
          updateDefaultRegionModelTemplateRegionModelsText
        }
        onReorderDefaultRegionModelTemplateRegions={
          reorderDefaultRegionModelTemplateRegions
        }
        onExportConfig={handleExportConfig}
        onImportConfig={handleImportConfig}
        onImportDeploymentResult={importDeploymentResultText}
        onRenumberAccounts={renumberAllAccounts}
        onUpdateAccountName={updateAccountName}
        onUpdateAccountSubscriptionId={updateAccountSubscriptionId}
        onUpdateAccountResourceGroupName={updateAccountResourceGroupName}
        onUpdateAccountServicePrincipal={updateAccountServicePrincipal}
        onUpdateAccountNote={updateAccountNote}
        onUpdateAccountEnabled={updateAccountEnabled}
        onUpdateAccountIncludeInStats={updateAccountIncludeInStats}
        onUpdateAccountTier={updateAccountTier}
        onUpdateAccountQuota={updateAccountQuota}
        onUpdateAccountPurchase={updateAccountPurchase}
        onUpdateAccountUsedAmount={updateAccountUsedAmount}
        onUpdateRegionDeployment={updateRegionDeployment}
        onApplyGeneratedRegionIdentity={applyGeneratedRegionIdentity}
        onDeleteAccount={deleteAccount}
        onAddRegion={addRegion}
        onDeleteRegion={deleteRegion}
        onUpdateRegionName={updateRegionName}
        onUpdateRegionModelsText={updateRegionModelsText}
        onUpdateRegionFoundryProjectEndpoint={
          updateRegionFoundryProjectEndpoint
        }
        onUpdateRegionOpenaiEndpoint={updateRegionOpenaiEndpoint}
        onUpdateRegionAiServicesEndpoint={updateRegionAiServicesEndpoint}
        onUpdateRegionAnthropicEndpoint={updateRegionAnthropicEndpoint}
        onUpdateRegionApiKey={updateRegionApiKey}
        onUpdateRegionDeploymentModel={updateRegionDeploymentModel}
        onUpdateRegionEnabled={updateRegionEnabled}
        onReorderAccounts={reorderAccounts}
        onReorderRegions={reorderRegions}
        onCopy={handleCopy}
      />

      {/* Account Detail Dialog */}
      <TableDetailDialog
        open={accountDetailOpen}
        onOpenChange={setAccountDetailOpen}
        title={t('statistics.accountOverview')}
        subtitle={t('statistics.accountSummary', {
          total: accounts.length,
          enabled: accounts.filter((a) => a.enabled).length,
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
          deployed: modelStates.filter((m) => m.status !== 'unused').length,
          unused: modelStates.filter((m) => m.status === 'unused').length,
        })}
      >
        <ModelStatisticsTable
          modelStates={modelStates}
          filteredModelStates={filteredModelStates}
          masterModels={masterModels}
          masterGroups={masterGroups}
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
