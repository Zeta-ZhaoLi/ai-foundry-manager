import React, { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { buildCopyString } from '../../utils/modelSeries';

export interface MasterModelDirectoryProps {
  masterText: string;
  onMasterTextChange: (text: string) => void;
  masterGroups: string[][];
  masterGroupLines: string[][][];
  masterModels: string[];
  onCopy: (text: string, label: string) => void;
}

export const MasterModelDirectory: React.FC<MasterModelDirectoryProps> = ({
  masterText,
  onMasterTextChange,
  masterGroups,
  masterGroupLines,
  masterModels,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <section
      className={clsx(
        'p-4 rounded-xl border border-gray-800',
        'bg-gradient-to-br from-slate-900 via-slate-950 to-black',
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
              'border border-gray-600 bg-background text-foreground',
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
              <button
                type="button"
                onClick={() =>
                  onCopy(buildCopyString(masterModels), t('masterModels.title'))
                }
                className={clsx(
                  'px-2.5 py-0.5 rounded-full',
                  'border border-primary bg-slate-900 text-foreground',
                  'cursor-pointer hover:bg-slate-800 transition-colors'
                )}
              >
                {t('masterModels.copyList')}
              </button>
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
                    <button
                      type="button"
                      onClick={() =>
                        onCopy(
                          groupLines
                            .map((line) => buildCopyString(line))
                            .join('\n'),
                          `${t('masterModels.title')} - ${t('common.group', {
                            index: groupIndex + 1,
                          })}`
                        )
                      }
                      className={clsx(
                        'px-2 py-0.5 rounded-full',
                        'border border-gray-600 bg-background text-foreground',
                        'text-xs cursor-pointer hover:bg-slate-800 transition-colors'
                      )}
                    >
                      {t('common.copy')}
                    </button>
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
                              'px-2 py-0.5 rounded-full text-xs',
                              'border border-slate-400/50',
                              'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20'
                            )}
                          >
                            {m}
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
