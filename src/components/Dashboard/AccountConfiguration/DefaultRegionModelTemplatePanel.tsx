import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type {
  DefaultRegionModelTemplateConfig,
} from '../../../hooks/useLocalAzureAccounts';
import { parseModels } from '../../../utils/common';
import { RegionModelSelector } from './RegionModelSelector';
import { SortableTemplateRegionCard } from './SortableTemplateRegionCard';

export interface DefaultRegionModelTemplatePanelProps {
  template: DefaultRegionModelTemplateConfig;
  masterModels: string[];
  masterGroups: string[][];
  masterGroupLines: string[][][];
  filteredModels: string[];
  onUpdateEnabled: (enabled: boolean) => void;
  onAddRegion: () => void;
  onDeleteRegion: (regionId: string) => void;
  onUpdateRegionName: (regionId: string, name: string) => void;
  onUpdateRegionModelsText: (regionId: string, modelsText: string) => void;
  onReorderRegions: (oldIndex: number, newIndex: number) => void;
  onCopy: (text: string, label: string) => void;
}

export const DefaultRegionModelTemplatePanel: React.FC<
  DefaultRegionModelTemplatePanelProps
> = ({
  template,
  masterModels,
  masterGroups,
  masterGroupLines,
  filteredModels,
  onUpdateEnabled,
  onAddRegion,
  onDeleteRegion,
  onUpdateRegionName,
  onUpdateRegionModelsText,
  onReorderRegions,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedModelCount = useMemo(
    () =>
      template.regions.reduce(
        (sum, region) => sum + parseModels(region.modelsText).length,
        0
      ),
    [template.regions]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = template.regions.findIndex(
      (region) => region.id === active.id
    );
    const newIndex = template.regions.findIndex(
      (region) => region.id === over.id
    );
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderRegions(oldIndex, newIndex);
    }
  };

  return (
    <div className="mb-3 rounded-lg border border-border bg-slate-950/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex min-w-0 items-center gap-2 bg-transparent border-none p-0 text-left text-foreground cursor-pointer"
        >
          <span className="inline-block w-4 text-center text-muted-foreground">
            {collapsed ? '>' : 'v'}
          </span>
          <span className="text-sm font-medium">
            {t('accounts.defaultRegionModelTemplate')}
          </span>
          <span className="text-xs text-muted-foreground">
            {template.enabled
              ? t('accounts.templateEnabled')
              : t('accounts.templateDisabled')}
            {' | '}
            {t('accounts.templateRegionCount', {
              count: template.regions.length,
            })}
            {' | '}
            {t('accounts.templateModelCount', { count: selectedModelCount })}
          </span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={template.enabled}
              onChange={(event) => onUpdateEnabled(event.target.checked)}
            />
            <span>{t('accounts.enableTemplate')}</span>
          </label>
          <button
            type="button"
            onClick={onAddRegion}
            className={clsx(
              'px-2.5 py-0.5 rounded-full',
              'border border-cyan-500 bg-slate-900 text-cyan-200',
              'text-xs cursor-pointer hover:bg-slate-800'
            )}
          >
            + {t('regions.addRegion')}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3">
          {template.regions.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              {t('accounts.templateNoRegions')}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={template.regions.map((region) => region.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {template.regions.map((region, index) => {
                    const displayName =
                      region.name ||
                      `${t('regions.region')} ${index + 1}`;
                    return (
                      <SortableTemplateRegionCard
                        key={region.id}
                        id={region.id}
                      >
                        <div className="rounded-lg border border-gray-800 bg-background p-2">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {index + 1}.
                            </span>
                            <input
                              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                              value={region.name}
                              onChange={(event) =>
                                onUpdateRegionName(
                                  region.id,
                                  event.target.value
                                )
                              }
                              placeholder="eastus2"
                            />
                            <button
                              type="button"
                              onClick={() => onDeleteRegion(region.id)}
                              className="px-2 py-0.5 rounded-full border border-red-900 bg-red-900/30 text-red-300 text-xs cursor-pointer hover:bg-red-900/50"
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                          <RegionModelSelector
                            modelsText={region.modelsText}
                            masterModels={masterModels}
                            masterGroups={masterGroups}
                            masterGroupLines={masterGroupLines}
                            filteredModels={filteredModels}
                            title={t('regions.modelsToggle')}
                            copyLabel={`${t(
                              'accounts.defaultRegionModelTemplate'
                            )} / ${displayName}`}
                            onChange={(modelsText) =>
                              onUpdateRegionModelsText(region.id, modelsText)
                            }
                            onCopy={onCopy}
                          />
                        </div>
                      </SortableTemplateRegionCard>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
};

DefaultRegionModelTemplatePanel.displayName =
  'DefaultRegionModelTemplatePanel';
