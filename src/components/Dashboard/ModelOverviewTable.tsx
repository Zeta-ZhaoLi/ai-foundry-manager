import React, { useRef, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DonutChart, DonutChartData } from './Charts';
import { LocalAccount } from './AccountConfiguration/AccountCard';
import { CurrencyType } from '../../hooks/useLocalAzureAccounts';

export interface ModelState {
  model: string;
  count: number;
  pct: number;
  status: 'unused' | 'single' | 'multi';
}

// 筛选类型
export type AccountStatusFilter = 'all' | 'enabled' | 'disabled';
export type AccountTierFilter = 'all' | 'premium' | 'standard';

export interface ModelOverviewTableProps {
  filteredModelStates: ModelState[];
  modelStates: ModelState[];
  totalRegions: number;
  accounts: LocalAccount[];
  privacyMode?: boolean;
  onUpdateAccountPurchase?: (id: string, amount: number, currency: CurrencyType) => void;
  onUpdateAccountUsedAmount?: (id: string, usedAmount: number) => void;
}

// 额度颜色方案
const QUOTA_COLORS = [
  '#22d3ee', // cyan-400
  '#4ade80', // green-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
  '#f87171', // red-400
  '#fbbf24', // amber-400
  '#94a3b8', // slate-400
  '#ec4899', // pink-500
];

const ROW_HEIGHT = 36;

// 计算成本/$ (每美元账户额度的实际成本)
const getCostPerDollar = (account: LocalAccount): { value: number; currency: CurrencyType } | null => {
  const quota = account.quota === 'custom'
    ? (account.customQuota || 0)
    : Number(account.quota || 200);
  if (quota === 0 || !account.purchaseAmount) return null;
  return {
    value: account.purchaseAmount / quota,
    currency: account.purchaseCurrency || 'USD',
  };
};

export const ModelOverviewTable: React.FC<ModelOverviewTableProps> = ({
  accounts,
  privacyMode = false,
  onUpdateAccountPurchase,
  onUpdateAccountUsedAmount,
}) => {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>('all');
  const [tierFilter, setTierFilter] = useState<AccountTierFilter>('all');

  // 计算各类别数量
  const statusCounts = useMemo(() => ({
    all: accounts.length,
    enabled: accounts.filter(a => a.enabled).length,
    disabled: accounts.filter(a => !a.enabled).length,
  }), [accounts]);

  const tierCounts = useMemo(() => ({
    all: accounts.length,
    premium: accounts.filter(a => a.tier === 'premium').length,
    standard: accounts.filter(a => a.tier !== 'premium').length,
  }), [accounts]);

  // 应用筛选
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (statusFilter === 'enabled' && !acc.enabled) return false;
      if (statusFilter === 'disabled' && acc.enabled) return false;
      if (tierFilter === 'premium' && acc.tier !== 'premium') return false;
      if (tierFilter === 'standard' && acc.tier === 'premium') return false;
      return true;
    });
  }, [accounts, statusFilter, tierFilter]);

  // 计算启用的账号数量
  const enabledAccounts = useMemo(() => accounts.filter(a => a.enabled), [accounts]);

  const virtualizer = useVirtualizer({
    count: filteredAccounts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  // 账号状态分布（启用/禁用）
  const enabledDistribution: DonutChartData[] = useMemo(() => {
    const enabled = accounts.filter(a => a.enabled).length;
    const disabled = accounts.filter(a => !a.enabled).length;
    return [
      { label: t('statistics.enabled'), value: enabled, color: '#4ade80' },
      { label: t('statistics.disabledLabel'), value: disabled, color: '#f87171' },
    ].filter(d => d.value > 0);
  }, [accounts, t]);

  // 账号类别分布（高级/普通）
  const tierDistribution: DonutChartData[] = useMemo(() => {
    const premium = accounts.filter(a => a.tier === 'premium').length;
    const standard = accounts.filter(a => a.tier !== 'premium').length;
    return [
      { label: t('accounts.tierPremium'), value: premium, color: '#fbbf24' },
      { label: t('accounts.tierStandard'), value: standard, color: '#94a3b8' },
    ].filter(d => d.value > 0);
  }, [accounts, t]);

  // 账号额度分布
  const quotaDistribution: DonutChartData[] = useMemo(() => {
    const quotaCounts: Record<string, { count: number; amount: number }> = {};

    accounts.forEach((acc) => {
      const quota = acc.quota || '200';
      let label: string;
      let amount: number;

      if (quota === 'custom') {
        amount = acc.customQuota || 0;
        label = `$${amount.toLocaleString()}`;
      } else {
        amount = Number(quota);
        label = `$${amount.toLocaleString()}`;
      }

      if (!quotaCounts[label]) {
        quotaCounts[label] = { count: 0, amount };
      }
      quotaCounts[label].count++;
    });

    // 按金额排序
    const sortedQuotas = Object.entries(quotaCounts)
      .sort((a, b) => a[1].amount - b[1].amount)
      .map(([label, data], idx) => ({
        label,
        value: data.count,
        color: QUOTA_COLORS[idx % QUOTA_COLORS.length],
      }));

    return sortedQuotas.filter(d => d.value > 0);
  }, [accounts]);

  // 获取账号的模型数和区域数
  const getAccountStats = (account: LocalAccount) => {
    const enabledRegions = account.regions.filter(r => r.enabled !== false);
    const regionCount = enabledRegions.length;
    const modelSet = new Set<string>();
    enabledRegions.forEach(r => {
      if (r.modelsText) {
        r.modelsText.split(/[\s,]+/).filter(Boolean).forEach(m => modelSet.add(m));
      }
    });
    return { regionCount, modelCount: modelSet.size };
  };

  // 获取额度显示文本
  const getQuotaLabel = (account: LocalAccount) => {
    const quota = account.quota || '200';
    if (quota === 'custom') {
      return `$${(account.customQuota || 0).toLocaleString()}`;
    }
    return `$${Number(quota).toLocaleString()}`;
  };

  // 获取购买金额显示
  const getPurchaseLabel = (account: LocalAccount) => {
    if (!account.purchaseAmount) return '-';
    const symbol = account.purchaseCurrency === 'CNY' ? '¥' : '$';
    return `${symbol}${account.purchaseAmount.toLocaleString()}`;
  };

  // 获取已使用显示
  const getUsedLabel = (account: LocalAccount) => {
    if (account.usedAmount === undefined || account.usedAmount === null) return '-';
    return `$${account.usedAmount.toLocaleString()}`;
  };

  // 获取账号成本显示 (购买金额/额度)
  const getAccountCostLabel = (account: LocalAccount) => {
    const cost = getCostPerDollar(account);
    if (!cost) return '-';
    const symbol = cost.currency === 'CNY' ? '¥' : '$';
    return `${symbol}${cost.value.toFixed(2)}`;
  };

  // 获取实际成本显示 (购买金额/已使用)
  const getActualCostLabel = (account: LocalAccount) => {
    const used = account.usedAmount || 0;
    if (used === 0 || !account.purchaseAmount) return '-';
    const cost = account.purchaseAmount / used;
    const symbol = account.purchaseCurrency === 'CNY' ? '¥' : '$';
    return `${symbol}${cost.toFixed(2)}`;
  };

  // 获取隐私模式下的账号名
  const getDisplayName = (account: LocalAccount, index: number) => {
    if (privacyMode) {
      return `${t('accounts.account')} ${index + 1}`;
    }
    return account.name || `${t('accounts.account')} ${index + 1}`;
  };

  // 双击定位到账号配置
  const handleDoubleClick = (accountId: string) => {
    const element = document.getElementById(`account-card-${accountId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('highlight-flash');
      setTimeout(() => element.classList.remove('highlight-flash'), 1500);
    }
  };

  return (
    <section className="p-3 sm:p-4 rounded-xl border border-gray-800 bg-background">
      <h2 className="text-base sm:text-lg font-semibold mb-1">{t('statistics.accountOverview')}</h2>
      <div className="text-xs text-muted-foreground mb-3">
        {t('statistics.accountSummary', {
          total: accounts.length,
          enabled: enabledAccounts.length,
        })}
      </div>

      {/* Charts Grid - 账号统计饼图 */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* 账号状态分布 (启用/禁用) */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('statistics.accountStatus')}
            </h3>
            <DonutChart data={enabledDistribution} size={100} strokeWidth={20} />
          </div>

          {/* 账号类别分布 (高级/普通) */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('statistics.tierDistribution')}
            </h3>
            <DonutChart data={tierDistribution} size={100} strokeWidth={20} />
          </div>

          {/* 账号额度分布 */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('statistics.quotaDistribution')}
            </h3>
            <DonutChart data={quotaDistribution} size={100} strokeWidth={20} />
          </div>
        </div>
      )}

      {/* 筛选按钮 */}
      {accounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* 状态筛选 */}
          <div className="flex items-center gap-1">
            {(['all', 'enabled', 'disabled'] as AccountStatusFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={clsx(
                  'px-2 py-1 rounded-full text-xs border transition-colors',
                  statusFilter === filter
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-gray-700 bg-background text-muted-foreground hover:bg-gray-800'
                )}
              >
                {filter === 'all' && `${t('coverage.filterAll')} (${statusCounts.all})`}
                {filter === 'enabled' && `${t('statistics.enabled')} (${statusCounts.enabled})`}
                {filter === 'disabled' && `${t('statistics.disabledLabel')} (${statusCounts.disabled})`}
              </button>
            ))}
          </div>

          <span className="text-gray-600">|</span>

          {/* 类别筛选 */}
          <div className="flex items-center gap-1">
            {(['all', 'premium', 'standard'] as AccountTierFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTierFilter(filter)}
                className={clsx(
                  'px-2 py-1 rounded-full text-xs border transition-colors',
                  tierFilter === filter
                    ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                    : 'border-gray-700 bg-background text-muted-foreground hover:bg-gray-800'
                )}
              >
                {filter === 'all' && `${t('coverage.filterAll')} (${tierCounts.all})`}
                {filter === 'premium' && `${t('accounts.tierPremium')} (${tierCounts.premium})`}
                {filter === 'standard' && `${t('accounts.tierStandard')} (${tierCounts.standard})`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account Table */}
      {accounts.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('statistics.noAccounts')}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('coverage.noModelsOrNoMatch')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-background">
          <div className="min-w-[900px]">
            {/* Header */}
            <div
              className={clsx(
                'grid gap-2 px-2.5 py-1.5',
                'border-b border-gray-800',
                'text-xs text-muted-foreground'
              )}
              style={{ gridTemplateColumns: '40px minmax(0, 2fr) 80px 80px 90px 80px 90px 90px 60px 60px 70px' }}
            >
              <div>#</div>
              <div>{t('accounts.accountName')}</div>
              <div>{t('accounts.tier')}</div>
              <div>{t('accounts.quota')}</div>
              <div>{t('accounts.purchaseAmount')}</div>
              <div>{t('accounts.usedAmount')}</div>
              <div>{t('accounts.accountCost')}</div>
              <div>{t('accounts.actualCost')}</div>
              <div>{t('statistics.regionCount')}</div>
              <div>{t('statistics.modelCount')}</div>
              <div>{t('models.status')}</div>
            </div>

            {/* Virtual Scrolling Rows */}
            <div
              ref={parentRef}
              className="max-h-64 overflow-y-auto"
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const account = filteredAccounts[virtualRow.index];
                  const stats = getAccountStats(account);
                  // 找到原始索引用于显示
                  const originalIndex = accounts.findIndex(a => a.id === account.id);
                  return (
                    <div
                      key={account.id}
                      className={clsx(
                        'grid gap-2 px-2.5 items-center',
                        'border-b border-gray-900',
                        'text-xs text-foreground',
                        !account.enabled && 'opacity-50'
                      )}
                      style={{
                        gridTemplateColumns: '40px minmax(0, 2fr) 80px 80px 90px 80px 90px 90px 60px 60px 70px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="text-muted-foreground">{originalIndex + 1}</div>
                      <div
                        className="whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1 cursor-pointer hover:text-cyan-400 transition-colors"
                        title={`${getDisplayName(account, originalIndex)} (${t('statistics.doubleClickToLocate')})`}
                        onDoubleClick={() => handleDoubleClick(account.id)}
                      >
                        {account.tier === 'premium' && <span>⭐</span>}
                        {getDisplayName(account, originalIndex)}
                      </div>
                      <div>
                        <span
                          className={clsx(
                            'inline-block px-2 py-0.5 rounded-full text-xs border',
                            account.tier === 'premium'
                              ? 'border-amber-900 bg-amber-900/30 text-amber-300'
                              : 'border-gray-700 bg-gray-800/50 text-gray-400'
                          )}
                        >
                          {account.tier === 'premium' ? t('accounts.tierPremium') : t('accounts.tierStandard')}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {getQuotaLabel(account)}
                      </div>
                      <div className="text-muted-foreground">
                        {privacyMode ? '***' : getPurchaseLabel(account)}
                      </div>
                      <div className="text-muted-foreground">
                        {privacyMode ? '***' : getUsedLabel(account)}
                      </div>
                      <div className="text-muted-foreground">
                        {privacyMode ? '***' : getAccountCostLabel(account)}
                      </div>
                      <div className="text-muted-foreground">
                        {privacyMode ? '***' : getActualCostLabel(account)}
                      </div>
                      <div>{stats.regionCount}</div>
                      <div>{stats.modelCount}</div>
                      <div>
                        <span
                          className={clsx(
                            'inline-block px-2 py-0.5 rounded-full text-xs border',
                            account.enabled
                              ? 'border-green-900 bg-green-900/30 text-green-300'
                              : 'border-red-900 bg-red-900/30 text-red-300'
                          )}
                        >
                          {account.enabled ? t('statistics.enabled') : t('statistics.disabledLabel')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

ModelOverviewTable.displayName = 'ModelOverviewTable';
