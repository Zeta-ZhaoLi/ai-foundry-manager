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
  totalRegions: number;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onCopy?: (text: string, label: string) => void;
}

// Model category classification
const categorizeModel = (model: string): 'standard' | 'sora' | 'claude' => {
  const lower = model.toLowerCase();
  if (lower.startsWith('sora') || lower.includes('sora')) return 'sora';
  if (lower.startsWith('claude') || lower.includes('claude')) return 'claude';
  return 'standard';
};

const ROW_HEIGHT = 36;

export const ModelStatisticsTable: React.FC<ModelStatisticsTableProps> = ({
  modelStates,
  filteredModelStates,
  totalRegions,
  statusFilter,
  onStatusFilterChange,
  onCopy,
}) => {
  const { t } = useTranslation();
  const parentRef = useRef<HTMLDivElement>(null);

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
  const statusCounts = useMemo(() => ({
    all: modelStates.length,
    unused: modelStates.filter(m => m.status === 'unused').length,
    single: modelStates.filter(m => m.status === 'single').length,
    multi: modelStates.filter(m => m.status === 'multi').length,
  }), [modelStates]);

  // 处理模型名点击复制
  const handleCopyModel = (modelName: string) => {
    if (onCopy) {
      onCopy(modelName, modelName);
    }
  };

  const virtualizer = useVirtualizer({
    count: filteredModelStates.length,
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
      { label: t('modelStatistics.singleRegion'), value: single, color: '#fbbf24' },
      { label: t('modelStatistics.multiRegion'), value: multi, color: '#4ade80' },
    ].filter((d) => d.value > 0);
  }, [modelStates, t]);

  // Model category distribution
  const categoryDistribution: DonutChartData[] = useMemo(() => {
    const categories = { standard: 0, sora: 0, claude: 0 };
    modelStates.forEach((m) => {
      const cat = categorizeModel(m.model);
      categories[cat]++;
    });
    return [
      { label: t('modelCategory.standard'), value: categories.standard, color: '#22d3ee' },
      { label: t('modelCategory.sora'), value: categories.sora, color: '#a78bfa' },
      { label: t('modelCategory.claude'), value: categories.claude, color: '#fb923c' },
    ].filter((d) => d.value > 0);
  }, [modelStates, t]);

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

  // Get category badge style
  const getCategoryBadgeStyle = (category: 'standard' | 'sora' | 'claude') => {
    switch (category) {
      case 'sora':
        return 'border-violet-900 bg-violet-900/30 text-violet-300';
      case 'claude':
        return 'border-orange-900 bg-orange-900/30 text-orange-300';
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

  // Get category label
  const getCategoryLabel = (category: 'standard' | 'sora' | 'claude') => {
    switch (category) {
      case 'sora':
        return t('modelCategory.sora');
      case 'claude':
        return t('modelCategory.claude');
      default:
        return 'Standard';
    }
  };

  return (
    <section className="p-3 sm:p-4 rounded-xl border border-gray-800 bg-background">
      <h2 className="text-base sm:text-lg font-semibold mb-1">
        {t('modelStatistics.title')}
      </h2>
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
            <DonutChart data={categoryDistribution} size={100} strokeWidth={20} />
          </div>

          {/* Coverage Distribution */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              {t('modelStatistics.coverageDistribution')}
            </h3>
            <DonutChart data={coverageDistribution} size={100} strokeWidth={20} />
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-3">
        {(['all', 'unused', 'single', 'multi'] as StatusFilter[]).map((filter) => (
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
            {filter === 'all' && `${t('coverage.filterAll')} (${statusCounts.all})`}
            {filter === 'unused' && `${t('modelStatistics.unused')} (${statusCounts.unused})`}
            {filter === 'single' && `${t('modelStatistics.singleRegion')} (${statusCounts.single})`}
            {filter === 'multi' && `${t('modelStatistics.multiRegion')} (${statusCounts.multi})`}
          </button>
        ))}
      </div>

      {/* Model Table */}
      {modelStates.length === 0 ? (
        <div className="text-xs text-gray-500">{t('modelStatistics.noModels')}</div>
      ) : filteredModelStates.length === 0 ? (
        <div className="text-xs text-gray-500">{t('coverage.noModelsOrNoMatch')}</div>
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
                gridTemplateColumns: '40px minmax(0, 2fr) 100px 100px 80px 80px',
              }}
            >
              <div>#</div>
              <div>{t('modelStatistics.columnModel')}</div>
              <div>{t('modelStatistics.columnCategory')}</div>
              <div>{t('modelStatistics.columnStatus')}</div>
              <div>{t('modelStatistics.columnRegions')}</div>
              <div>{t('modelStatistics.columnCoverage')}</div>
            </div>

            {/* Virtual Scrolling Rows */}
            <div ref={parentRef} className="max-h-64 overflow-y-auto">
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const model = filteredModelStates[virtualRow.index];
                  const category = categorizeModel(model.model);
                  return (
                    <div
                      key={model.model}
                      className={clsx(
                        'grid gap-2 px-2.5 items-center',
                        'border-b border-gray-900',
                        'text-xs text-foreground'
                      )}
                      style={{
                        gridTemplateColumns: '40px minmax(0, 2fr) 100px 100px 80px 80px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div className="text-muted-foreground">{virtualRow.index + 1}</div>
                      <div
                        className="whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:text-cyan-400 transition-colors"
                        title={`${model.model} (${t('common.clickToCopy')})`}
                        onClick={() => handleCopyModel(model.model)}
                      >
                        {model.model}
                      </div>
                      <div>
                        <span
                          className={clsx(
                            'inline-block px-2 py-0.5 rounded-full text-xs border',
                            getCategoryBadgeStyle(category)
                          )}
                        >
                          {getCategoryLabel(category)}
                        </span>
                      </div>
                      <div>
                        <span
                          className={clsx(
                            'inline-block px-2 py-0.5 rounded-full text-xs border',
                            getStatusBadgeStyle(model.status)
                          )}
                        >
                          {getStatusLabel(model.status)}
                        </span>
                      </div>
                      <div>
                        {model.count}/{totalRegions}
                      </div>
                      <div>{model.pct}%</div>
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

ModelStatisticsTable.displayName = 'ModelStatisticsTable';
