import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { buildCopyString } from '../../utils/modelSeries';

export interface MasterModelDirectoryProps {
  masterText: string;
  onMasterTextChange: (text: string) => void;
  masterGroups: string[][];
  masterGroupLines: string[][][];
  masterModels: string[];
  deployedModelsOrdered: string[];
  deployedRegionCounts: Record<string, number>;
  onCopy: (text: string, label: string) => void;
}

export const MasterModelDirectory: React.FC<MasterModelDirectoryProps> = ({
  masterText,
  onMasterTextChange,
  masterGroups,
  masterGroupLines,
  masterModels,
  deployedModelsOrdered,
  deployedRegionCounts,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);

  const deployedSet = useMemo(
    () => new Set(deployedModelsOrdered),
    [deployedModelsOrdered]
  );

  return (
    <section
      className={clsx(
        'p-4 rounded-xl border border-border',
        'bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-black',
        'text-foreground shadow-lg',
        'section-glow'
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-between gap-2',
          !collapsed && 'mb-2'
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex items-center gap-1.5 bg-transparent text-foreground text-lg font-semibold cursor-pointer border-none p-0"
        >
          <span className="inline-block w-4 text-center text-muted-foreground text-xs">
            {collapsed ? '▶' : '▼'}
          </span>
          <span>{t('masterModels.title')}</span>
        </button>
        {!collapsed && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t('masterModels.parsedCount', { count: masterModels.length })}
          </span>
        )}
      </div>

      {!collapsed && (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            {t('masterModels.description')}
          </p>
          <textarea
            className={clsx(
              'w-full min-h-20 p-2 rounded-lg',
              'border border-border bg-background text-foreground',
              'text-sm resize-y',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={masterText}
            onChange={(e) => onMasterTextChange(e.target.value)}
            placeholder={t('masterModels.placeholder')}
          />
          <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {t('masterModels.parsedCount', { count: masterModels.length })}
            </span>
            {masterModels.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      buildCopyString(masterModels),
                      t('masterModels.copyAll')
                    )
                  }
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full',
                    'border border-primary bg-primary/10 text-foreground',
                    'cursor-pointer hover:bg-primary/20 transition-colors'
                  )}
                >
                  {t('masterModels.copyAll')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      buildCopyString(deployedModelsOrdered),
                      t('masterModels.copyDeployed')
                    )
                  }
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full',
                    'border border-border bg-background text-foreground',
                    'cursor-pointer hover:bg-muted transition-colors'
                  )}
                >
                  {t('masterModels.copyDeployed')}
                </button>
              </div>
            )}
          </div>
          {masterModels.length > 0 && (
            <div className="mt-2 space-y-3">
              {masterGroupLines.map((groupLines, groupIndex) => (
                <div key={`group-${groupIndex}`} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {t('common.group', { index: groupIndex + 1 })} (
                      {masterGroups[groupIndex]?.length || 0})
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onCopy(
                            groupLines
                              .map((line) => buildCopyString(line))
                              .join('\n'),
                            `${t('common.group', { index: groupIndex + 1 })} - ${t(
                              'masterModels.copyGroupAll'
                            )}`
                          )
                        }
                        className={clsx(
                          'px-2 py-0.5 rounded-full',
                          'border border-border bg-background text-foreground',
                          'text-xs cursor-pointer hover:bg-muted transition-colors'
                        )}
                      >
                        {t('masterModels.copyGroupAll')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCopy(
                            groupLines
                              .map((line) =>
                                buildCopyString(
                                  line.filter((m) => deployedSet.has(m))
                                )
                              )
                              .filter(Boolean)
                              .join('\n'),
                            `${t('common.group', { index: groupIndex + 1 })} - ${t(
                              'masterModels.copyGroupDeployed'
                            )}`
                          )
                        }
                        className={clsx(
                          'px-2 py-0.5 rounded-full',
                          'border border-border bg-background text-foreground',
                          'text-xs cursor-pointer hover:bg-muted transition-colors'
                        )}
                      >
                        {t('masterModels.copyGroupDeployed')}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {groupLines.map((line, lineIndex) => (
                      <div
                        key={`group-${groupIndex}-line-${lineIndex}`}
                        className="flex flex-wrap gap-1.5"
                      >
                        {line.map((m) => (
                          <span
                            key={m}
                            className={clsx(
                              'px-2 py-0.5 rounded-full text-xs relative',
                              'border border-slate-400/50',
                              'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20'
                            )}
                          >
                            {m}
                            <span
                              className={clsx(
                                'absolute -top-1 -right-1',
                                'min-w-[16px] h-[16px] px-1',
                                'rounded-full text-[10px] leading-[16px] text-center',
                                'bg-cyan-500 text-black'
                              )}
                              title={t('masterModels.deployedRegions', {
                                count: deployedRegionCounts[m] || 0,
                              })}
                            >
                              {deployedRegionCounts[m] || 0}
                            </span>
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

MasterModelDirectory.displayName = 'MasterModelDirectory';
