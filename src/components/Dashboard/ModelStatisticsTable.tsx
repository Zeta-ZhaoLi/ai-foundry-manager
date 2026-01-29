import React, { useRef, useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DonutChart, DonutChartData } from './Charts';
import { ModelState } from './ModelOverviewTable';
import { StatusFilter } from './CoverageCharts/ModelCoverageChart';

export interface ModelStatisticsTableProps {
  modelStates: ModelState[];
  filteredModelStates: ModelState[];
  masterModels: string[];
  masterGroups: string[][];
  totalRegions: number;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onCopy?: (text: string, label: string) => void;
  modelAccountsMap?: Map<string, string[]>;
  isDetailView?: boolean;
  onOpenDetail?: () => void;
}

const GROUP_COLORS = [
  '#22d3ee',
  '#a78bfa',
  '#fb923c',
  '#4ade80',
  '#fbbf24',
  '#f87171',
  '#60a5fa',
  '#34d399',
];

const ROW_HEIGHT = 36;

export const ModelStatisticsTable: React.FC<ModelStatisticsTableProps> = ({
  modelStates,
  filteredModelStates,
  masterModels,
  masterGroups,
  totalRegions,
  statusFilter,
  onStatusFilterChange,
  onCopy,
  modelAccountsMap,
  isDetailView = false,
  onOpenDetail,
}) => {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

  const masterOrder = useMemo(() => {
    const map = new Map<string, number>();
    masterModels.forEach((m, idx) => map.set(m, idx));
    return map;
  }, [masterModels]);

  const groupIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    masterGroups.forEach((group, groupIdx) => {
      group.forEach((m) => {
        if (!map.has(m)) map.set(m, groupIdx);
      });
    });
    return map;
  }, [masterGroups]);

  const getGroupIndex = (model: string) => groupIndexMap.get(model) ?? -1;

  // Summary statistics
  const totalModels = modelStates.length;
  const deployedModels = useMemo(
    () => modelStates.filter((m) => m.status !== 'unused').length,
    [modelStates]
  );
  const unusedModels = useMemo(
    () => modelStates.filter((m) => m.status === 'unused').length,
    [modelStates]
  );

  // 计算各状态数量
  const statusCounts = useMemo(
    () => ({
      all: modelStates.length,
      unused: modelStates.filter((m) => m.status === 'unused').length,
      single: modelStates.filter((m) => m.status === 'single').length,
      multi: modelStates.filter((m) => m.status === 'multi').length,
    }),
    [modelStates]
  );

  // 计算筛选后的状态数量
  const filteredStatusCounts = useMemo(
    () => ({
      unused: filteredModelStates.filter((m) => m.status === 'unused').length,
      single: filteredModelStates.filter((m) => m.status === 'single').length,
      multi: filteredModelStates.filter((m) => m.status === 'multi').length,
    }),
    [filteredModelStates]
  );

  // 合计行数据 - 基于筛选后数据
  const modelSummaryData = useMemo(() => {
    if (filteredModelStates.length === 0) return null;

    // 计算平均部署账号数
    let totalAccountCount = 0;
    let modelsWithAccounts = 0;
    filteredModelStates.forEach((m) => {
      const accounts = modelAccountsMap?.get(m.model);
      if (accounts && accounts.length > 0) {
        totalAccountCount += accounts.length;
        modelsWithAccounts++;
      }
    });
    const avgAccounts =
      modelsWithAccounts > 0 ? totalAccountCount / modelsWithAccounts : 0;

    // 计算平均覆盖区域数
    const totalRegionCount = filteredModelStates.reduce(
      (sum, m) => sum + m.count,
      0
    );
    const avgRegions =
      filteredModelStates.length > 0
        ? totalRegionCount / filteredModelStates.length
        : 0;

    // 计算平均覆盖率
    const totalPct = filteredModelStates.reduce((sum, m) => sum + m.pct, 0);
    const avgPct =
      filteredModelStates.length > 0
        ? totalPct / filteredModelStates.length
        : 0;

    return {
      totalModels: filteredModelStates.length,
      statusCounts: filteredStatusCounts,
      avgAccounts: Math.round(avgAccounts * 10) / 10,
      avgRegions: Math.round(avgRegions * 10) / 10,
      avgPct: Math.round(avgPct * 10) / 10,
    };
  }, [filteredModelStates, modelAccountsMap, filteredStatusCounts]);

  // 处理模型名点击复制
  const handleCopyModel = (modelName: string) => {
    if (onCopy) {
      onCopy(modelName, modelName);
    }
  };

  // 按全局模型目录分组排序（未在目录中的模型排在最后）
  const sortedFilteredModelStates = useMemo(() => {
    return [...filteredModelStates].sort((a, b) => {
      const gA = getGroupIndex(a.model);
      const gB = getGroupIndex(b.model);
      const orderA = gA >= 0 ? gA : Number.POSITIVE_INFINITY;
      const orderB = gB >= 0 ? gB : Number.POSITIVE_INFINITY;
      if (orderA !== orderB) return orderA - orderB;

      const aIdx = masterOrder.get(a.model);
      const bIdx = masterOrder.get(b.model);
      if (aIdx !== undefined && bIdx !== undefined && aIdx !== bIdx) {
        return aIdx - bIdx;
      }

      return a.model.localeCompare(b.model);
    });
  }, [filteredModelStates, groupIndexMap, masterOrder]);

  const virtualizer = useVirtualizer({
    count: sortedFilteredModelStates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  // Deployment status distribution
  const statusDistribution: DonutChartData[] = useMemo(() => {
    const unused = modelStates.filter((m) => m.status === 'unused').length;
    const single = modelStates.filter((m) => m.status === 'single').length;
    const multi = modelStates.filter((m) => m.status === 'multi').length;
    return [
      { label: t('modelStatistics.unused'), value: unused, color: '#f87171' },
      {
        label: t('modelStatistics.singleRegion'),
        value: single,
        color: '#fbbf24',
      },
      {
        label: t('modelStatistics.multiRegion'),
        value: multi,
        color: '#4ade80',
      },
    ].filter((d) => d.value > 0);
  }, [modelStates, t]);

  // Group distribution (by Global Model Directory)
  const categoryDistribution: DonutChartData[] = useMemo(() => {
    const counts = new Map<number, number>();
    let otherCount = 0;

    modelStates.forEach((m) => {
      const g = getGroupIndex(m.model);
      if (g < 0) {
        otherCount++;
        return;
      }
      counts.set(g, (counts.get(g) || 0) + 1);
    });

    const groupEntries = Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([groupIdx, value]) => ({ groupIdx, value }))
      .filter((d) => d.value > 0);

    const MAX_GROUP_SEGMENTS = 8;
    const visibleGroups = groupEntries.slice(0, MAX_GROUP_SEGMENTS);
    const overflowGroups = groupEntries.slice(MAX_GROUP_SEGMENTS);

    const overflowCount = overflowGroups.reduce((sum, d) => sum + d.value, 0);
    const otherTotal = otherCount + overflowCount;

    const data: DonutChartData[] = visibleGroups.map((d) => ({
      label: t('common.group', { index: d.groupIdx + 1 }),
      value: d.value,
      color: GROUP_COLORS[d.groupIdx % GROUP_COLORS.length],
    }));

    if (otherTotal > 0) {
      data.push({
        label: t('common.other'),
        value: otherTotal,
        color: '#94a3b8',
      });
    }

    return data;
  }, [modelStates, groupIndexMap, t]);

  // Coverage distribution
  const coverageDistribution: DonutChartData[] = useMemo(() => {
    const ranges: Record<string, number> = {
      '0%': 0,
      '1-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-100%': 0,
    };
    modelStates.forEach((m) => {
      if (m.pct === 0) ranges['0%']++;
      else if (m.pct <= 25) ranges['1-25%']++;
      else if (m.pct <= 50) ranges['26-50%']++;
      else if (m.pct <= 75) ranges['51-75%']++;
      else ranges['76-100%']++;
    });
    return [
      { label: '0%', value: ranges['0%'], color: '#f87171' },
      { label: '1-25%', value: ranges['1-25%'], color: '#fb923c' },
      { label: '26-50%', value: ranges['26-50%'], color: '#fbbf24' },
      { label: '51-75%', value: ranges['51-75%'], color: '#4ade80' },
      { label: '76-100%', value: ranges['76-100%'], color: '#22d3ee' },
    ].filter((d) => d.value > 0);
  }, [modelStates]);

  // Get group badge style
  const getGroupBadgeStyle = (groupIdx: number) => {
    if (groupIdx < 0) return 'border-gray-700 bg-gray-900/30 text-gray-300';
    switch (groupIdx % 4) {
      case 1:
        return 'border-violet-900 bg-violet-900/30 text-violet-300';
      case 2:
        return 'border-orange-900 bg-orange-900/30 text-orange-300';
      case 3:
        return 'border-green-900 bg-green-900/30 text-green-300';
      default:
        return 'border-cyan-900 bg-cyan-900/30 text-cyan-300';
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: 'unused' | 'single' | 'multi') => {
    switch (status) {
      case 'unused':
        return 'border-red-900 bg-red-900/30 text-red-300';
      case 'single':
        return 'border-amber-900 bg-amber-900/30 text-amber-300';
      default:
        return 'border-green-900 bg-green-900/30 text-green-300';
    }
  };

  // Get status label
  const getStatusLabel = (status: 'unused' | 'single' | 'multi') => {
    switch (status) {
      case 'unused':
        return t('modelStatistics.unused');
      case 'single':
        return t('modelStatistics.singleRegion');
      default:
        return t('modelStatistics.multiRegion');
    }
  };

  const getGroupLabel = (groupIdx: number) => {
    if (groupIdx < 0) return t('common.other');
    return t('common.group', { index: groupIdx + 1 });
  };

  return (
    <section
      className={clsx(
        'p-3 sm:p-4 rounded-xl border border-gray-800 bg-background',
        !isDetailView && 'section-glow'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base sm:text-lg font-semibold">
          {t('modelStatistics.title')}
        </h2>
        {!isDetailView && onOpenDetail && (
          <button
            type="button"
            onClick={onOpenDetail}
            className="px-2 py-1 text-xs rounded-md border border-gray-700 text-muted-foreground hover:text-foreground hover:bg-gray-800 transition-colors"
          >
            {t('common.detail', '详情')}
          </button>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-3">
        {t('modelStatistics.summary', {
          total: totalModels,
          deployed: deployedModels,
          unused: unusedModels,
        })}
      </div>

      {/* Charts Grid */}
      {modelStates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* Deployment Status Distribution */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('modelStatistics.deploymentStatus')}
            </h3>
            <DonutChart data={statusDistribution} size={100} strokeWidth={20} />
          </div>

          {/* Model Category Distribution */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('modelStatistics.categoryDistribution')}
            </h3>
            <DonutChart
              data={categoryDistribution}
              size={100}
              strokeWidth={20}
            />
          </div>

          {/* Coverage Distribution */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('modelStatistics.coverageDistribution')}
            </h3>
            <DonutChart
              data={coverageDistribution}
              size={100}
              strokeWidth={20}
            />
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-3">
        {(['all', 'unused', 'single', 'multi'] as StatusFilter[]).map(
          (filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onStatusFilterChange(filter)}
              className={clsx(
                'px-3 py-1 rounded-full text-xs border transition-colors',
                statusFilter === filter
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                  : 'border-gray-700 bg-background text-muted-foreground hover:bg-gray-800'
              )}
            >
              {filter === 'all' &&
                `${t('coverage.filterAll')} (${statusCounts.all})`}
              {filter === 'unused' &&
                `${t('modelStatistics.unused')} (${statusCounts.unused})`}
              {filter === 'single' &&
                `${t('modelStatistics.singleRegion')} (${statusCounts.single})`}
              {filter === 'multi' &&
                `${t('modelStatistics.multiRegion')} (${statusCounts.multi})`}
            </button>
          )
        )}
      </div>

      {/* Model Table */}
      {modelStates.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('modelStatistics.noModels')}
        </div>
      ) : sortedFilteredModelStates.length === 0 ? (
        <div className="text-xs text-gray-500">
          {t('coverage.noModelsOrNoMatch')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800 bg-background">
          <div className="min-w-[700px]">
            {/* Header */}
            <div
              className={clsx(
                'grid gap-2 px-2.5 py-1.5',
                'border-b border-gray-800',
                'text-xs text-muted-foreground'
              )}
              style={{
                gridTemplateColumns:
                  '40px minmax(0, 2fr) 100px 100px 100px 80px 80px',
              }}
            >
              <div className="text-center">#</div>
              <div>{t('modelStatistics.columnModel')}</div>
              <div className="text-center">
                {t('modelStatistics.columnCategory')}
              </div>
              <div className="text-center">
                {t('modelStatistics.columnStatus')}
              </div>
              <div className="text-center">
                {t('modelStatistics.deployedAccounts')}
              </div>
              <div className="text-center">
                {t('modelStatistics.columnRegions')}
              </div>
              <div className="text-center">
                {t('modelStatistics.columnCoverage')}
              </div>
            </div>

            {/* Virtual Scrolling Rows */}
            <div
              ref={parentRef}
              className={clsx(
                'overflow-y-auto',
                isDetailView ? 'max-h-[60vh]' : 'max-h-64'
              )}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const model = sortedFilteredModelStates[virtualRow.index];
                  const groupIdx = getGroupIndex(model.model);
                  return (
                    <div
                      key={model.model}
                      className={clsx(
                        'grid gap-2 px-2.5 items-center',
                        'border-b border-gray-900',
                        'text-xs text-foreground'
                      )}
                      style={{
                        gridTemplateColumns:
                          '40px minmax(0, 2fr) 100px 100px 100px 80px 80px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="text-muted-foreground text-center">
                        {virtualRow.index + 1}
                      </div>
                      <div
                        className="whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-cyan-400 transition-colors"
                        title={`${model.model} (${t('common.clickToCopy')})`}
                        onClick={() => handleCopyModel(model.model)}
                      >
                        {model.model}
                      </div>
                      <div className="text-center">
                        <span
                          className={clsx(
                            'inline-block px-2 py-0.5 rounded-full text-xs border',
                            getGroupBadgeStyle(groupIdx)
                          )}
                        >
                          {getGroupLabel(groupIdx)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span
                          className={clsx(
                            'inline-block px-2 py-0.5 rounded-full text-xs border',
                            getStatusBadgeStyle(model.status)
                          )}
                        >
                          {getStatusLabel(model.status)}
                        </span>
                      </div>
                      <div
                        className="text-muted-foreground text-center whitespace-nowrap overflow-hidden text-ellipsis"
                        title={
                          modelAccountsMap?.get(model.model)?.join(', ') || '-'
                        }
                      >
                        {modelAccountsMap?.get(model.model)?.join(', ') || '-'}
                      </div>
                      <div className="text-center">
                        {model.count}/{totalRegions}
                      </div>
                      <div className="text-center">{model.pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 合计行 - 冻结在底部 */}
            {modelSummaryData && (
              <div
                className={clsx(
                  'grid gap-2 px-2.5 py-2 items-center',
                  'border-t-2 border-cyan-800 bg-slate-900/80',
                  'text-xs text-foreground font-medium sticky bottom-0'
                )}
                style={{
                  gridTemplateColumns:
                    '40px minmax(0, 2fr) 100px 100px 100px 80px 80px',
                }}
              >
                <div className="text-cyan-400 text-center">
                  {t('statistics.total')}
                </div>
                <div className="text-cyan-400">
                  {modelSummaryData.totalModels}{' '}
                  {t('modelStatistics.modelsLabel')}
                </div>
                <div className="text-muted-foreground text-[10px] text-center">
                  -
                </div>
                <div className="text-muted-foreground text-[10px] text-center">
                  <span className="text-red-300">
                    {modelSummaryData.statusCounts.unused}
                  </span>
                  <span className="mx-0.5">/</span>
                  <span className="text-amber-300">
                    {modelSummaryData.statusCounts.single}
                  </span>
                  <span className="mx-0.5">/</span>
                  <span className="text-green-300">
                    {modelSummaryData.statusCounts.multi}
                  </span>
                </div>
                <div className="text-muted-foreground text-center">
                  ~{modelSummaryData.avgAccounts}
                </div>
                <div className="text-muted-foreground text-center">
                  ~{modelSummaryData.avgRegions}
                </div>
                <div className="text-muted-foreground text-center">
                  ~{modelSummaryData.avgPct}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

ModelStatisticsTable.displayName = 'ModelStatisticsTable';
