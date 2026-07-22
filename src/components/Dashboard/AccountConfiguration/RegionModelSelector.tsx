import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { buildCopyString } from '../../../utils/modelSeries';
import { orderModelsByMaster, parseModels } from '../../../utils/common';
import { useToast } from '../../../hooks/useToast';

export interface RegionModelSelectorProps {
  modelsText: string;
  masterModels: string[];
  masterGroups: string[][];
  masterGroupLines: string[][][];
  filteredModels: string[];
  title: string;
  copyLabel: string;
  defaultCollapsed?: boolean;
  onChange: (modelsText: string) => void;
  onCopy: (text: string, label: string) => void;
}

export const RegionModelSelector: React.FC<RegionModelSelectorProps> = ({
  modelsText,
  masterModels,
  masterGroups,
  masterGroupLines,
  filteredModels,
  title,
  copyLabel,
  defaultCollapsed = true,
  onChange,
  onCopy,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const selectedModels = useMemo(() => parseModels(modelsText), [modelsText]);
  const selectedSet = useMemo(() => new Set(selectedModels), [selectedModels]);
  const orderedModels = useMemo(
    () => orderModelsByMaster(selectedModels, masterModels),
    [selectedModels, masterModels]
  );
  const groupedFilteredLines = useMemo((): {
    idx: number;
    lines: string[][];
  }[] => {
    const visible = new Set(filteredModels);

    return masterGroupLines
      .map((groupLines, idx) => {
        const lines = groupLines
          .map((line) => line.filter((m) => visible.has(m)))
          .filter((line) => line.length > 0);

        return { idx, lines };
      })
      .filter((group) => group.lines.length > 0);
  }, [filteredModels, masterGroupLines]);

  const toggleModel = (modelId: string) => {
    const set = new Set(parseModels(modelsText));
    if (set.has(modelId)) {
      set.delete(modelId);
    } else {
      set.add(modelId);
    }
    onChange(orderModelsByMaster(Array.from(set), masterModels).join(','));
  };

  const selectAll = () => {
    if (masterModels.length === 0) return;
    onChange(masterModels.join(','));
  };

  const selectGroup = (models: string[]) => {
    if (models.length === 0) return;
    const set = new Set(parseModels(modelsText));
    for (const model of models) {
      set.add(model);
    }
    onChange(orderModelsByMaster(Array.from(set), masterModels).join(','));
  };

  const clearModels = () => {
    onChange('');
  };

  const handlePasteModels = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const models = text
        .split(/[\s,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (models.length === 0) {
        toast.error(t('regions.pasteEmpty'));
        return;
      }

      const mergedSet = new Set([...parseModels(modelsText), ...models]);
      onChange(
        orderModelsByMaster(Array.from(mergedSet), masterModels).join(',')
      );
      toast.success(t('regions.pasteSuccess', { count: models.length }));
    } catch {
      toast.error(t('regions.pasteFailed'));
    }
  };

  return (
    <div className="border-t border-border pt-2">
      <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex min-w-0 items-center gap-1.5 bg-transparent text-foreground text-xs cursor-pointer border-none p-0"
        >
          <span className="inline-block w-3.5 text-center text-muted-foreground">
            {collapsed ? '>' : 'v'}
          </span>
          <span>{title}</span>
          {orderedModels.length > 0 && (
            <span className="text-muted-foreground ml-1">
              ({orderedModels.length})
            </span>
          )}
        </button>

        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
          <button
            type="button"
            onClick={handlePasteModels}
            className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            {t('regions.pasteModels')}
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
          >
            {t('regions.selectAll')}
          </button>
          <button
            type="button"
            onClick={clearModels}
            className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
          >
            {t('regions.clear')}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {masterModels.length === 0 ? (
            <div className="text-xs text-gray-500 mt-1">
              {t('regions.configureMasterFirst')}
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-xs text-gray-500 mt-1">
              {t('regions.noMatchingModels')}
            </div>
          ) : (
            <div className="space-y-2 mt-1.5">
              {groupedFilteredLines.map(({ idx, lines }) => {
                const groupTitle = t('common.group', { index: idx + 1 });
                const groupAllModels = masterGroups[idx] || [];
                const selectedGroupModels = groupAllModels.filter((model) =>
                  selectedSet.has(model)
                );

                return (
                  <div
                    key={`group-${idx}`}
                    className="rounded-md border border-border p-2"
                  >
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                        {groupTitle}
                        <span className="text-muted-foreground ml-1">
                          ({selectedGroupModels.length}/{groupAllModels.length})
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        {selectedGroupModels.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              onCopy(
                                buildCopyString(selectedGroupModels),
                                `${copyLabel} - ${groupTitle}`
                              )
                            }
                            className="rounded border border-border bg-transparent px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            title={t('regions.copyGroupModels')}
                          >
                            Copy
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => selectGroup(groupAllModels)}
                          className="rounded border border-border bg-transparent px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {t('regions.selectGroup')}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {lines.map((line, lineIndex) => (
                        <div
                          key={`group-${idx}-line-${lineIndex}`}
                          className="flex flex-wrap gap-1.5"
                        >
                          {line.map((model) => {
                            const selected = selectedSet.has(model);
                            return (
                              <button
                                key={model}
                                type="button"
                                onClick={() => toggleModel(model)}
                                className={clsx(
                                  'px-2 py-1 rounded-full text-xs cursor-pointer transition-all',
                                  selected
                                    ? 'border border-cyan-500 bg-gradient-to-r from-cyan-500 to-green-500 text-white'
                                    : 'border border-gray-600 bg-background text-foreground hover:border-gray-500'
                                )}
                              >
                                {model}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {orderedModels.length > 0 && (
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
          <span>
            {t('regions.selectedCount', { count: orderedModels.length })}
          </span>
          <button
            type="button"
            onClick={() => onCopy(buildCopyString(orderedModels), copyLabel)}
            className="rounded-full border border-border bg-background px-2 py-0.5 text-foreground hover:bg-muted"
          >
            {t('regions.copyRegionModels')}
          </button>
        </div>
      )}
    </div>
  );
};

RegionModelSelector.displayName = 'RegionModelSelector';
