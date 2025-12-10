import React, { useState, useMemo } from 'react';
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
import { LocalAccount } from './AccountCard';
import { SortableAccountCard } from './SortableAccountCard';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { AccountTier, AccountQuota, CurrencyType } from '../../../hooks/useLocalAzureAccounts';

export interface AccountsSectionProps {
  accounts: LocalAccount[];
  masterModels: string[];
  filteredModels: string[];
  modelFilterInput: string;
  privacyMode?: boolean;
  onFilterChange: (value: string) => void;
  onAddAccount: () => void;
  onExportConfig: () => void;
  onUpdateAccountName: (accountId: string, name: string) => void;
  onUpdateAccountNote: (accountId: string, note: string) => void;
  onUpdateAccountEnabled: (accountId: string, enabled: boolean) => void;
  onUpdateAccountIncludeInStats?: (accountId: string, includeInStats: boolean) => void;
  onUpdateAccountTier: (accountId: string, tier: AccountTier) => void;
  onUpdateAccountQuota: (accountId: string, quota: AccountQuota, customQuota?: number) => void;
  onUpdateAccountPurchase?: (accountId: string, amount: number, currency: CurrencyType) => void;
  onUpdateAccountUsedAmount?: (accountId: string, usedAmount: number) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddRegion: (accountId: string) => void;
  onDeleteRegion: (accountId: string, regionId: string) => void;
  onUpdateRegionName: (accountId: string, regionId: string, name: string) => void;
  onUpdateRegionModelsText: (accountId: string, regionId: string, text: string) => void;
  onUpdateRegionOpenaiEndpoint: (accountId: string, regionId: string, endpoint: string) => void;
  onUpdateRegionAnthropicEndpoint: (accountId: string, regionId: string, endpoint: string) => void;
  onUpdateRegionApiKey: (accountId: string, regionId: string, apiKey: string) => void;
  onUpdateRegionEnabled: (accountId: string, regionId: string, enabled: boolean) => void;
  onReorderAccounts?: (oldIndex: number, newIndex: number) => void;
  onReorderRegions?: (accountId: string, oldIndex: number, newIndex: number) => void;
  onCopy: (text: string, label: string) => void;
}

export const AccountsSection: React.FC<AccountsSectionProps> = ({
  accounts,
  masterModels,
  filteredModels,
  modelFilterInput,
  privacyMode = false,
  onFilterChange,
  onAddAccount,
  onExportConfig,
  onUpdateAccountName,
  onUpdateAccountNote,
  onUpdateAccountEnabled,
  onUpdateAccountIncludeInStats,
  onUpdateAccountTier,
  onUpdateAccountQuota,
  onUpdateAccountPurchase,
  onUpdateAccountUsedAmount,
  onDeleteAccount,
  onAddRegion,
  onDeleteRegion,
  onUpdateRegionName,
  onUpdateRegionModelsText,
  onUpdateRegionOpenaiEndpoint,
  onUpdateRegionAnthropicEndpoint,
  onUpdateRegionApiKey,
  onUpdateRegionEnabled,
  onReorderAccounts,
  onReorderRegions,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [showExportWarning, setShowExportWarning] = useState(false);

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

  const handleExport = () => {
    setShowExportWarning(false);
    onExportConfig();
  };

  // Sort accounts: premium accounts first, then maintain original order
  const sortedAccounts = useMemo(() => {
    return [...accounts]
      .map((account, originalIndex) => ({ account, originalIndex }))
      .sort((a, b) => {
        const aTier = a.account.tier === 'premium' ? 0 : 1;
        const bTier = b.account.tier === 'premium' ? 0 : 1;
        if (aTier !== bTier) return aTier - bTier;
        return a.originalIndex - b.originalIndex;
      });
  }, [accounts]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderAccounts) {
      const oldIndex = accounts.findIndex((a) => a.id === active.id);
      const newIndex = accounts.findIndex((a) => a.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderAccounts(oldIndex, newIndex);
      }
    }
  };

  return (
    <>
      <section className="p-4 rounded-xl border border-gray-800 bg-background section-glow">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold mb-1">{t('accounts.title')}</h2>
            <div className="text-sm text-muted-foreground">
              {t('accounts.description')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddAccount}
              className={clsx(
                'px-3 py-1.5 rounded-full',
                'border border-cyan-500 bg-gradient-to-r from-cyan-500/90 to-green-500/90',
                'text-white text-sm font-medium cursor-pointer',
                'hover:from-cyan-600 hover:to-green-600 transition-colors'
              )}
            >
              + {t('accounts.addAccount')}
            </button>
            <button
              type="button"
              onClick={() => setShowExportWarning(true)}
              className={clsx(
                'px-3 py-1.5 rounded-full',
                'border border-gray-600 bg-background text-foreground',
                'text-xs cursor-pointer hover:bg-slate-800 transition-colors'
              )}
            >
              {t('accounts.exportConfig')}
            </button>
          </div>
        </div>

        {/* Search filter */}
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('accounts.modelSearch')}</span>
          <input
            className={clsx(
              'flex-1 min-w-0 p-1 rounded-full',
              'border border-gray-700 bg-background text-foreground text-xs',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={modelFilterInput}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder={t('accounts.searchPlaceholder')}
          />
          {modelFilterInput && (
            <button
              type="button"
              onClick={() => onFilterChange('')}
              className={clsx(
                'px-2 py-0.5 rounded-full',
                'border border-gray-600 bg-background text-foreground',
                'text-xs cursor-pointer hover:bg-slate-800'
              )}
            >
              {t('common.clear')}
            </button>
          )}
        </div>

        {/* Accounts list with drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedAccounts.map((item) => item.account.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {sortedAccounts.map(({ account, originalIndex }) => (
                <SortableAccountCard
                  key={account.id}
                  account={account}
                  index={originalIndex}
                  privacyMode={privacyMode}
                  masterModels={masterModels}
                  filteredModels={filteredModels}
                  onUpdateName={(name) => onUpdateAccountName(account.id, name)}
                  onUpdateNote={(note) => onUpdateAccountNote(account.id, note)}
                  onUpdateEnabled={(enabled) => onUpdateAccountEnabled(account.id, enabled)}
                  onUpdateIncludeInStats={onUpdateAccountIncludeInStats ? (includeInStats) => onUpdateAccountIncludeInStats(account.id, includeInStats) : undefined}
                  onUpdateTier={(tier) => onUpdateAccountTier(account.id, tier)}
                  onUpdateQuota={(quota, customQuota) => onUpdateAccountQuota(account.id, quota, customQuota)}
                  onUpdatePurchase={onUpdateAccountPurchase ? (amount, currency) => onUpdateAccountPurchase(account.id, amount, currency) : undefined}
                  onUpdateUsedAmount={onUpdateAccountUsedAmount ? (usedAmount) => onUpdateAccountUsedAmount(account.id, usedAmount) : undefined}
                  onDelete={() => onDeleteAccount(account.id)}
                  onAddRegion={() => onAddRegion(account.id)}
                  onDeleteRegion={(regionId) => onDeleteRegion(account.id, regionId)}
                  onUpdateRegionName={(regionId, name) => onUpdateRegionName(account.id, regionId, name)}
                  onUpdateRegionModelsText={(regionId, text) => onUpdateRegionModelsText(account.id, regionId, text)}
                  onUpdateRegionOpenaiEndpoint={(regionId, endpoint) => onUpdateRegionOpenaiEndpoint(account.id, regionId, endpoint)}
                  onUpdateRegionAnthropicEndpoint={(regionId, endpoint) => onUpdateRegionAnthropicEndpoint(account.id, regionId, endpoint)}
                  onUpdateRegionApiKey={(regionId, apiKey) => onUpdateRegionApiKey(account.id, regionId, apiKey)}
                  onUpdateRegionEnabled={(regionId, enabled) => onUpdateRegionEnabled(account.id, regionId, enabled)}
                  onReorderRegions={onReorderRegions ? (oldIndex, newIndex) => onReorderRegions(account.id, oldIndex, newIndex) : undefined}
                  onCopy={onCopy}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      {/* Export security warning */}
      <ConfirmDialog
        open={showExportWarning}
        onOpenChange={setShowExportWarning}
        title={t('export.securityWarning')}
        description={t('export.securityDescription')}
        confirmText={t('export.proceed')}
        cancelText={t('common.cancel')}
        variant="warning"
        onConfirm={handleExport}
      />
    </>
  );
};

AccountsSection.displayName = 'AccountsSection';
