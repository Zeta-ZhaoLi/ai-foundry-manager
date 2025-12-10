import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { AccountTier } from '../../../hooks/useLocalAzureAccounts';

export interface RegionCoverageItem {
  key: string;
  label: string;
  usedCount: number;
  pct: number;
  accountId?: string;
  accountTier?: AccountTier;
}

export interface RegionCoverageChartProps {
  regionCoverage: RegionCoverageItem[];
  totalMasterModels: number;
  maxItems?: number;
  privacyMode?: boolean;
}

export const RegionCoverageChart: React.FC<RegionCoverageChartProps> = ({
  regionCoverage,
  totalMasterModels,
  maxItems = 10,
  privacyMode = false,
}) => {
  const { t } = useTranslation();

  // 生成匿名账号名称映射
  const accountIndexMap = new Map<string, number>();
  let accountIndex = 0;
  regionCoverage.forEach((r) => {
    if (r.accountId && !accountIndexMap.has(r.accountId)) {
      accountIndexMap.set(r.accountId, accountIndex++);
    }
  });

  // 获取显示标签（隐私模式下匿名化账号名）
  const getDisplayLabel = (item: RegionCoverageItem) => {
    if (!privacyMode) return item.label;
    // 原始 label 格式: "账号名 / 区域名"
    const parts = item.label.split(' / ');
    if (parts.length === 2 && item.accountId) {
      const idx = accountIndexMap.get(item.accountId) ?? 0;
      return `${t('accounts.account')} ${idx + 1} / ${parts[1]}`;
    }
    return item.label;
  };

  return (
    <div
      className={clsx(
        'w-full rounded-xl',
        'border border-gray-800 p-3 bg-background'
      )}
    >
      <div className="flex justify-between items-center mb-1.5">
        <div className="text-sm text-foreground">
          {t('coverage.regionCoverage')}
        </div>
        <div className="text-xs text-muted-foreground">
          {t('coverage.regionCoverageDesc')}
        </div>
      </div>

      {regionCoverage.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('coverage.noRegionsOrEmptyMaster')}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
          {regionCoverage.slice(0, maxItems).map((r) => (
            <div
              key={r.key}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="w-44 whitespace-nowrap overflow-hidden text-ellipsis text-foreground flex items-center gap-1"
                title={getDisplayLabel(r)}
              >
                {r.accountTier === 'premium' && (
                  <span title={t('accounts.tierPremium')}>⭐</span>
                )}
                {getDisplayLabel(r)}
              </span>
              <div
                className={clsx(
                  'flex-1 bg-background rounded-full',
                  'border border-gray-800 overflow-hidden h-2'
                )}
              >
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-green-500 transition-all"
                  style={{ width: `${r.pct}%` }}
                />
              </div>
              <span className="w-18 text-right text-muted-foreground">
                {r.usedCount}/{totalMasterModels} · {r.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

RegionCoverageChart.displayName = 'RegionCoverageChart';
