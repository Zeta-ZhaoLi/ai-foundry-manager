import React, { useRef, useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { groupModelsByCategory, ModelCategory } from '../../utils/modelSeries';
import { DonutChart, DonutChartData } from './Charts';

export interface ModelState {
  model: string;
  count: number;
  pct: number;
  status: 'unused' | 'single' | 'multi';
}

export interface ModelOverviewTableProps {
  filteredModelStates: ModelState[];
  modelStates: ModelState[];
  totalRegions: number;
}

const statusConfig = {
  unused: {
    label: 'models.statusUnused',
    border: 'border-red-900',
    bg: 'bg-red-900/30',
    text: 'text-red-300',
    color: '#f87171', // red-400 for SVG
  },
  single: {
    label: 'models.statusSingle',
    border: 'border-amber-900',
    bg: 'bg-amber-900/30',
    text: 'text-amber-300',
    color: '#fbbf24', // amber-400 for SVG
  },
  multi: {
    label: 'models.statusMulti',
    border: 'border-green-900',
    bg: 'bg-green-900/30',
    text: 'text-green-300',
    color: '#4ade80', // green-400 for SVG
  },
};

const categoryConfig: Record<ModelCategory, { labelKey: string; color: string }> = {
  standard: { labelKey: 'modelCategory.standard', color: '#22d3ee' }, // cyan-400
  sora: { labelKey: 'modelCategory.sora', color: '#a78bfa' },         // violet-400
  claude: { labelKey: 'modelCategory.claude', color: '#fb923c' },     // orange-400
};

const ROW_HEIGHT = 32;

export const ModelOverviewTable: React.FC<ModelOverviewTableProps> = ({
  filteredModelStates,
  modelStates,
  totalRegions,
}) => {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredModelStates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  // Calculate status distribution for donut chart
  const statusDistribution: DonutChartData[] = useMemo(() => {
    const counts = { unused: 0, single: 0, multi: 0 };
    modelStates.forEach((m) => {
      counts[m.status]++;
    });
    return [
      { label: t(statusConfig.multi.label), value: counts.multi, color: statusConfig.multi.color },
      { label: t(statusConfig.single.label), value: counts.single, color: statusConfig.single.color },
      { label: t(statusConfig.unused.label), value: counts.unused, color: statusConfig.unused.color },
    ];
  }, [modelStates, t]);

  // Calculate category distribution
  const categoryDistribution: DonutChartData[] = useMemo(() => {
    const allModels = modelStates.map((m) => m.model);
    const grouped = groupModelsByCategory(allModels);
    return [
      { label: t(categoryConfig.standard.labelKey), value: grouped.standard.length, color: categoryConfig.standard.color },
      { label: t(categoryConfig.sora.labelKey), value: grouped.sora.length, color: categoryConfig.sora.color },
      { label: t(categoryConfig.claude.labelKey), value: grouped.claude.length, color: categoryConfig.claude.color },
    ].filter((d) => d.value > 0);
  }, [modelStates, t]);

  // Calculate deployed vs unused per category
  const categoryDeploymentStats = useMemo(() => {
    const allModels = modelStates.map((m) => m.model);
    const grouped = groupModelsByCategory(allModels);
    const stats: Record<ModelCategory, { total: number; deployed: number; unused: number }> = {
      standard: { total: 0, deployed: 0, unused: 0 },
      sora: { total: 0, deployed: 0, unused: 0 },
      claude: { total: 0, deployed: 0, unused: 0 },
    };

    for (const state of modelStates) {
      const cat = grouped.standard.includes(state.model)
        ? 'standard'
        : grouped.sora.includes(state.model)
          ? 'sora'
          : 'claude';
      stats[cat].total++;
      if (state.status === 'unused') {
        stats[cat].unused++;
      } else {
        stats[cat].deployed++;
      }
    }

    return stats;
  }, [modelStates]);

  // Calculate coverage rate distribution (0-25%, 25-50%, 50-75%, 75-100%)
  const coverageDistribution: DonutChartData[] = useMemo(() => {
    const ranges = [
      { label: '0-25%', min: 0, max: 25, color: '#ef4444' },     // red
      { label: '26-50%', min: 26, max: 50, color: '#f59e0b' },   // amber
      { label: '51-75%', min: 51, max: 75, color: '#22c55e' },   // green
      { label: '76-100%', min: 76, max: 100, color: '#06b6d4' }, // cyan
    ];

    const counts = ranges.map((r) => ({
      ...r,
      value: modelStates.filter((m) => m.pct >= r.min && m.pct <= r.max).length,
    }));

    return counts.filter((c) => c.value > 0);
  }, [modelStates]);

  return (
    <section className="p-3 sm:p-4 rounded-xl border border-gray-800 bg-background">
      <h2 className="text-base sm:text-lg font-semibold mb-1">{t('models.title')}</h2>
      <div className="text-xs text-muted-foreground mb-3">
        {t('models.showingCount', {
          showing: filteredModelStates.length,
          total: modelStates.length,
        })}
      </div>

      {/* Charts Grid */}
      {modelStates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
          {/* Status Distribution */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('statistics.deploymentStatus')}
            </h3>
            <DonutChart data={statusDistribution} size={100} strokeWidth={20} />
          </div>

          {/* Category Distribution */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('statistics.categoryDistribution')}
            </h3>
            <DonutChart data={categoryDistribution} size={100} strokeWidth={20} />
          </div>

          {/* Coverage Distribution */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('statistics.coverageDistribution')}
            </h3>
            <DonutChart data={coverageDistribution} size={100} strokeWidth={20} />
          </div>
        </div>
      )}

      {/* Category Deployment Stats */}
      {/* 移动端：单列 | 小平板：两列 | 桌面：三列 */}
      {modelStates.length > 0 && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(['standard', 'sora', 'claude'] as ModelCategory[]).map((cat) => {
            const stats = categoryDeploymentStats[cat];
            if (stats.total === 0) return null;
            const deployRate = Math.round((stats.deployed / stats.total) * 100);
            const config = categoryConfig[cat];

            return (
              <div
                key={cat}
                className="p-3 rounded-lg border border-gray-800 bg-slate-900/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: config.color }}>
                    {t(config.labelKey)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stats.total} {t('statistics.totalModels')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${deployRate}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-foreground w-10 text-right">
                    {deployRate}%
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>{t('statistics.deployed')}: {stats.deployed}</span>
                  <span>{t('statistics.unused')}: {stats.unused}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Model Table */}
      {modelStates.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('models.emptyMaster')}
        </div>
      ) : filteredModelStates.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('models.noMatch')}
        </div>
      ) : (
        // 添加横向滚动容器用于移动端
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-background">
          <div className="min-w-[500px]">
            {/* Header */}
            <div
              className={clsx(
                'grid gap-2 px-2.5 py-1.5',
                'border-b border-gray-800',
                'text-xs text-muted-foreground'
              )}
              style={{ gridTemplateColumns: 'minmax(0, 2.5fr) 120px 130px 110px' }}
            >
              <div>{t('models.modelId')}</div>
              <div>{t('models.status')}</div>
              <div>{t('models.regionCoverage')}</div>
              <div>{t('models.coverageRate')}</div>
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
                const item = filteredModelStates[virtualRow.index];
                const config = statusConfig[item.status];
                return (
                  <div
                    key={item.model}
                    className={clsx(
                      'grid gap-2 px-2.5 items-center',
                      'border-b border-gray-900',
                      'text-xs text-foreground'
                    )}
                    style={{
                      gridTemplateColumns: 'minmax(0, 2.5fr) 120px 130px 110px',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div
                      className="whitespace-nowrap overflow-hidden text-ellipsis"
                      title={item.model}
                    >
                      {item.model}
                    </div>
                    <div>
                      <span
                        className={clsx(
                          'inline-block px-2 py-0.5 rounded-full text-xs',
                          'border',
                          config.border,
                          config.bg,
                          config.text
                        )}
                      >
                        {t(config.label)}
                      </span>
                    </div>
                    <div>
                      {item.count}/{totalRegions}
                    </div>
                    <div>{item.pct}%</div>
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
