import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { buildCopyString, groupModelsByCategory, ModelCategory } from '../../../utils/modelSeries';

export interface GlobalSummaryProps {
  allModels: string[];
  onCopy: (text: string, label: string) => void;
}

// 分类配置
const CATEGORY_CONFIG: Record<ModelCategory, { labelKey: string; color: string; bgColor: string }> = {
  standard: {
    labelKey: 'modelCategory.standard',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
  },
  sora: {
    labelKey: 'modelCategory.sora',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
  },
  claude: {
    labelKey: 'modelCategory.claude',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10 border-orange-500/30',
  },
};

// 分类显示顺序
const CATEGORY_ORDER: ModelCategory[] = ['standard', 'sora', 'claude'];

export const GlobalSummary: React.FC<GlobalSummaryProps> = ({
  allModels,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [collapsedCategories, setCollapsedCategories] = useState<Record<ModelCategory, boolean>>({
    standard: false,
    sora: false,
    claude: false,
  });

  // 按三大类分组
  const groupedModels = useMemo(
    () => groupModelsByCategory(allModels),
    [allModels]
  );

  if (allModels.length === 0) return null;

  const toggleCategory = (category: ModelCategory) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <section className="p-4 rounded-xl border border-gray-800 bg-background">
      <h2 className="text-lg font-semibold mb-2">{t('summary.globalTitle')}</h2>

      {/* 总体统计 */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-muted-foreground">
          {t('summary.totalModels', { count: allModels.length })}
        </div>
        <button
          type="button"
          onClick={() => onCopy(buildCopyString(allModels), t('summary.globalModelList'))}
          disabled={allModels.length === 0}
          className={clsx(
            'px-2.5 py-1 rounded-full',
            'border border-gray-600 bg-background text-foreground',
            'text-sm cursor-pointer hover:bg-slate-800',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {t('summary.copyAllModels')}
        </button>
      </div>

      {/* 按三大类展示 */}
      <div className="space-y-3">
        {CATEGORY_ORDER.map((category) => {
          const models = groupedModels[category];
          if (models.length === 0) return null;

          const config = CATEGORY_CONFIG[category];
          const collapsed = collapsedCategories[category];

          return (
            <div
              key={category}
              className={clsx(
                'rounded-lg border p-3',
                config.bgColor
              )}
            >
              {/* 分类头部 */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 bg-transparent text-foreground cursor-pointer border-none p-0"
                >
                  <span className="inline-block w-4 text-center text-muted-foreground text-sm">
                    {collapsed ? '▶' : '▼'}
                  </span>
                  <span className={clsx('text-sm font-medium', config.color)}>
                    {t(config.labelKey)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({models.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onCopy(buildCopyString(models), t(config.labelKey))}
                  className="px-2 py-0.5 rounded-full border border-gray-600 bg-background text-foreground text-xs cursor-pointer hover:bg-slate-800"
                >
                  {t('common.copy')}
                </button>
              </div>

              {/* 模型列表 */}
              {!collapsed && (
                <div
                  className={clsx(
                    'text-xs text-foreground',
                    'whitespace-pre-wrap break-all',
                    models.length > 20 && 'max-h-32 overflow-y-auto'
                  )}
                >
                  {buildCopyString(models)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

GlobalSummary.displayName = 'GlobalSummary';
