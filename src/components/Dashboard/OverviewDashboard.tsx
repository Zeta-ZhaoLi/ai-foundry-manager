import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export interface OverviewDashboardProps {
  totalAccounts: number;
  totalRegions: number;
  regionsWithModels: number;
  avgModelsPerRegion: number;
  totalMasterModels: number;
  totalUsedModels: number;
  unusedModelsCount: number;
  singleRegionModelsCount: number;
}

interface StatItemProps {
  label: string;
  value: number | string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold text-foreground">{value}</div>
  </div>
);

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  totalAccounts,
  totalRegions,
  regionsWithModels,
  avgModelsPerRegion,
  totalMasterModels,
  totalUsedModels,
  unusedModelsCount,
  singleRegionModelsCount,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={clsx(
        'w-full rounded-xl',
        'border border-gray-800 p-3 bg-background'
      )}
    >
      {/* 响应式 grid：移动端两列 */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatItem label={t('dashboard.accountCount')} value={totalAccounts} />
        <StatItem label={t('dashboard.regionCount')} value={totalRegions} />
        <StatItem label={t('dashboard.regionsWithModels')} value={regionsWithModels} />
        <StatItem label={t('dashboard.avgModelsPerRegion')} value={avgModelsPerRegion} />
        <StatItem label={t('dashboard.masterModelsCount')} value={totalMasterModels} />
        <StatItem label={t('dashboard.usedModelsCount')} value={totalUsedModels} />
        <StatItem label={t('dashboard.unusedModelsCount')} value={unusedModelsCount} />
        <StatItem label={t('dashboard.singleRegionModels')} value={singleRegionModelsCount} />
      </div>
    </div>
  );
};

OverviewDashboard.displayName = 'OverviewDashboard';
