import React, { useState } from 'react';
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
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { LocalRegion } from './RegionCard';
import { SortableRegionCard } from './SortableRegionCard';

export interface LocalAccount {
  id: string;
  name: string;
  note?: string;
  enabled: boolean;
  regions: LocalRegion[];
}

export interface AccountCardProps {
  account: LocalAccount;
  masterModels: string[];
  filteredModels: string[];
  onUpdateName: (name: string) => void;
  onUpdateNote: (note: string) => void;
  onUpdateEnabled: (enabled: boolean) => void;
  onDelete: () => void;
  onAddRegion: () => void;
  onDeleteRegion: (regionId: string) => void;
  onUpdateRegionName: (regionId: string, name: string) => void;
  onUpdateRegionModelsText: (regionId: string, text: string) => void;
  onUpdateRegionOpenaiEndpoint: (regionId: string, endpoint: string) => void;
  onUpdateRegionAnthropicEndpoint: (regionId: string, endpoint: string) => void;
  onUpdateRegionApiKey: (regionId: string, apiKey: string) => void;
  onUpdateRegionEnabled: (regionId: string, enabled: boolean) => void;
  onReorderRegions?: (oldIndex: number, newIndex: number) => void;
  onCopy: (text: string, label: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  masterModels,
  filteredModels,
  onUpdateName,
  onUpdateNote,
  onUpdateEnabled,
  onDelete,
  onAddRegion,
  onDeleteRegion,
  onUpdateRegionName,
  onUpdateRegionModelsText,
  onUpdateRegionOpenaiEndpoint,
  onUpdateRegionAnthropicEndpoint,
  onUpdateRegionApiKey,
  onUpdateRegionEnabled,
  onReorderRegions,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderRegions) {
      const oldIndex = account.regions.findIndex((r) => r.id === active.id);
      const newIndex = account.regions.findIndex((r) => r.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderRegions(oldIndex, newIndex);
      }
    }
  };

  return (
    <>
      <div
        className={clsx(
          'rounded-xl border border-gray-800 p-3',
          'bg-gradient-to-br from-slate-950/90 to-slate-950/70',
          'shadow-lg',
          account.enabled ? 'opacity-100' : 'opacity-60'
        )}
      >
        {/* Account header - 账号名称 + 备注同行 */}
        {/* 移动端：单列布局 | 桌面端：多列布局 */}
        <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2">
          {/* 账号名称 */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('accounts.accountName')}
            </label>
            <input
              className={clsx(
                'w-full p-1.5 rounded-lg',
                'border border-gray-700 bg-background text-foreground text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
              )}
              value={account.name}
              onChange={(e) => onUpdateName(e.target.value)}
              placeholder={t('accounts.accountNamePlaceholder')}
            />
          </div>

          {/* 备注 */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('accounts.note')}
            </label>
            <input
              className={clsx(
                'w-full p-1.5 rounded-lg',
                'border border-gray-700 bg-background text-foreground text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
              )}
              value={account.note || ''}
              onChange={(e) => onUpdateNote(e.target.value)}
              placeholder={t('accounts.notePlaceholder')}
            />
          </div>

          {/* Enable/Delete - 移动端独立一行，两端对齐 */}
          <div className="flex items-center justify-between md:justify-start gap-2 md:pt-5 shrink-0">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={account.enabled}
                onChange={(e) => onUpdateEnabled(e.target.checked)}
                className="cursor-pointer"
              />
              <span>{t('accounts.enableAccount')}</span>
            </label>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className={clsx(
                'px-2.5 py-1 rounded-lg whitespace-nowrap',
                'border border-red-900 bg-red-900/30 text-red-300',
                'text-xs cursor-pointer hover:bg-red-900/50'
              )}
            >
              {t('accounts.deleteAccount')}
            </button>
          </div>
        </div>

        {/* Regions */}
        <div className="mb-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium">{t('regions.regionList')}</div>
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

          {account.regions.length === 0 ? (
            <div className="text-xs text-gray-500">
              {t('regions.noRegions')}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={account.regions.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2 mt-1">
                  {account.regions.map((region) => (
                    <SortableRegionCard
                      key={region.id}
                      region={region}
                      accountId={account.id}
                      accountName={account.name || account.id}
                      masterModels={masterModels}
                      filteredModels={filteredModels}
                      onUpdateName={(name) => onUpdateRegionName(region.id, name)}
                      onUpdateModelsText={(text) => onUpdateRegionModelsText(region.id, text)}
                      onUpdateOpenaiEndpoint={(endpoint) => onUpdateRegionOpenaiEndpoint(region.id, endpoint)}
                      onUpdateAnthropicEndpoint={(endpoint) => onUpdateRegionAnthropicEndpoint(region.id, endpoint)}
                      onUpdateApiKey={(apiKey) => onUpdateRegionApiKey(region.id, apiKey)}
                      onUpdateEnabled={(enabled) => onUpdateRegionEnabled(region.id, enabled)}
                      onDelete={() => onDeleteRegion(region.id)}
                      onCopy={onCopy}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('confirmDialog.deleteAccount.title')}
        description={t('confirmDialog.deleteAccount.description')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        onConfirm={onDelete}
      />
    </>
  );
};

AccountCard.displayName = 'AccountCard';
