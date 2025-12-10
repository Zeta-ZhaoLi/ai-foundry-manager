import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export interface ModelCoverageItem {
  model: string;
  count: number;
  pct: number;
}

export type StatusFilter = 'all' | 'unused' | 'single' | 'multi';

export interface ModelCoverageChartProps {
  modelCoverage: ModelCoverageItem[];
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  totalRegions: number;
}

export const ModelCoverageChart: React.FC<ModelCoverageChartProps> = ({
  modelCoverage,
  statusFilter,
  onStatusFilterChange,
  totalRegions,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={clsx(
        'w-full rounded-xl md:col-span-2 lg:col-span-1',
        'border border-gray-800 p-3 bg-background'
      )}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <div className="text-sm text-foreground">
            {t('coverage.modelCoverage')}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('coverage.modelCoverageDesc')}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className={clsx(
              'px-1.5 py-0.5 rounded-full',
              'border border-gray-600 bg-background text-foreground',
              'cursor-pointer'
            )}
          >
            <option value="all">{t('coverage.filterAll')}</option>
            <option value="unused">{t('coverage.filterUnused')}</option>
            <option value="single">{t('coverage.filterSingle')}</option>
            <option value="multi">{t('coverage.filterMulti')}</option>
          </select>
        </div>
      </div>

      {modelCoverage.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('coverage.noModelsOrNoMatch')}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {modelCoverage.map((m) => (
            <div
              key={m.model}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="w-36 whitespace-nowrap overflow-hidden text-ellipsis text-foreground"
                title={m.model}
              >
                {m.model}
              </span>
              <div
                className={clsx(
                  'flex-1 bg-background rounded-full',
                  'border border-gray-800 overflow-hidden h-2'
                )}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-green-500 transition-all"
                  style={{ width: `${m.pct}%` }}
                />
              </div>
              <span className="w-19 text-right text-muted-foreground">
                {m.count}/{totalRegions} · {m.pct}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ModelCoverageChart.displayName = 'ModelCoverageChart';
