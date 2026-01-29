import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { buildCopyString } from '../../../utils/modelSeries';

export interface GlobalSummaryProps {
  allModels: string[];
  masterGroups: string[][];
  masterGroupLines: string[][][];
  onCopy: (text: string, label: string) => void;
}

export const GlobalSummary: React.FC<GlobalSummaryProps> = ({
  allModels,
  masterGroups,
  masterGroupLines,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  const allSet = useMemo(() => new Set(allModels), [allModels]);
  const masterIndex = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < masterGroups.length; i++) {
      for (const model of masterGroups[i]) {
        if (!m.has(model)) m.set(model, i);
      }
    }
    return m;
  }, [masterGroups]);

  const groupedUsedModels = useMemo(() => {
    const groups: {
      key: string;
      title: string;
      lines: string[][];
      models: string[];
    }[] = [];

    for (let i = 0; i < masterGroupLines.length; i++) {
      const lines = (masterGroupLines[i] || [])
        .map((line) => line.filter((m) => allSet.has(m)))
        .filter((line) => line.length > 0);
      if (lines.length === 0) continue;
      const models = lines.flat();
      groups.push({
        key: `g-${i}`,
        title: t('common.group', { index: i + 1 }),
        lines,
        models,
      });
    }

    // not-in-directory models appended at end
    const ungrouped = allModels.filter((m) => !masterIndex.has(m));
    if (ungrouped.length > 0) {
      groups.push({
        key: 'other',
        title: t('common.other', 'Other'),
        lines: [ungrouped],
        models: ungrouped,
      });
    }

    return groups;
  }, [allModels, allSet, masterGroupLines, masterIndex, t]);

  if (allModels.length === 0) return null;

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="p-4 rounded-xl border border-gray-800 bg-background section-glow">
      <h2 className="text-lg font-semibold mb-2">{t('summary.globalTitle')}</h2>

      {/* 总体统计 */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-muted-foreground">
          {t('summary.totalModels', { count: allModels.length })}
        </div>
        <button
          type="button"
          onClick={() =>
            onCopy(buildCopyString(allModels), t('summary.globalModelList'))
          }
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
        {groupedUsedModels.map((group) => {
          const collapsed = !!collapsedGroups[group.key];

          return (
            <div
              key={group.key}
              className={clsx(
                'rounded-lg border p-3',
                'border-gray-700 bg-slate-900/30'
              )}
            >
              {/* 分类头部 */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center gap-2 bg-transparent text-foreground cursor-pointer border-none p-0"
                >
                  <span className="inline-block w-4 text-center text-muted-foreground text-sm">
                    {collapsed ? '▶' : '▼'}
                  </span>
                  <span
                    className={clsx('text-sm font-medium', 'text-cyan-300')}
                  >
                    {group.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({group.models.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      group.lines
                        .map((line) => buildCopyString(line))
                        .join('\n'),
                      group.title
                    )
                  }
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
                    group.models.length > 20 && 'max-h-32 overflow-y-auto'
                  )}
                >
                  {group.lines.map((line) => buildCopyString(line)).join('\n')}
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
