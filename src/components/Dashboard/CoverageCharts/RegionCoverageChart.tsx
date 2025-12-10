import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export interface RegionCoverageItem {
  key: string;
  label: string;
  usedCount: number;
  pct: number;
}

export interface RegionCoverageChartProps {
  regionCoverage: RegionCoverageItem[];
  totalMasterModels: number;
  maxItems?: number;
}

export const RegionCoverageChart: React.FC<RegionCoverageChartProps> = ({
  regionCoverage,
  totalMasterModels,
  maxItems = 10,
}) => {
  const { t } = useTranslation();

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
                className="w-44 whitespace-nowrap overflow-hidden text-ellipsis text-foreground"
                title={r.label}
              >
                {r.label}
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
