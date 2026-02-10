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
import { EmptyState, NoAccountIcon } from '../../ui/EmptyState';
import {
  AccountTier,
  AccountQuota,
  CurrencyType,
  RegionDeploymentConfig,
  RegionDeploymentModelConfig,
} from '../../../hooks/useLocalAzureAccounts';
import { useToast } from '../../../hooks/useToast';
import { parseModels } from '../../../utils/common';

export interface AccountsSectionProps {
  accounts: LocalAccount[];
  masterGroups: string[][];
  masterGroupLines: string[][][];
  masterModels: string[];
  filteredModels: string[];
  modelFilterInput: string;
  privacyMode?: boolean;
  onFilterChange: (value: string) => void;
  onAddAccount: () => void;
  onExportConfig: () => void;
  onImportConfig?: (jsonString: string) => { success: boolean; error?: string };
  onRenumberAccounts?: () => void;
  onUpdateAccountName: (accountId: string, name: string) => void;
  onUpdateAccountNote: (accountId: string, note: string) => void;
  onUpdateAccountEnabled: (accountId: string, enabled: boolean) => void;
  onUpdateAccountIncludeInStats?: (
    accountId: string,
    includeInStats: boolean
  ) => void;
  onUpdateAccountTier: (accountId: string, tier: AccountTier) => void;
  onUpdateAccountQuota: (
    accountId: string,
    quota: AccountQuota,
    customQuota?: number
  ) => void;
  onUpdateAccountPurchase?: (
    accountId: string,
    amount: number,
    currency: CurrencyType
  ) => void;
  onUpdateAccountUsedAmount?: (accountId: string, usedAmount: number) => void;
  onUpdateRegionDeployment?: (
    accountId: string,
    regionId: string,
    patch: Partial<RegionDeploymentConfig>
  ) => void;
  onDeleteAccount: (accountId: string) => void;
  onAddRegion: (accountId: string) => void;
  onDeleteRegion: (accountId: string, regionId: string) => void;
  onUpdateRegionName: (
    accountId: string,
    regionId: string,
    name: string
  ) => void;
  onUpdateRegionModelsText: (
    accountId: string,
    regionId: string,
    text: string
  ) => void;
  onUpdateRegionOpenaiEndpoint: (
    accountId: string,
    regionId: string,
    endpoint: string
  ) => void;
  onUpdateRegionFoundryProjectEndpoint?: (
    accountId: string,
    regionId: string,
    endpoint: string
  ) => void;
  onUpdateRegionAiServicesEndpoint?: (
    accountId: string,
    regionId: string,
    endpoint: string
  ) => void;
  onUpdateRegionAnthropicEndpoint: (
    accountId: string,
    regionId: string,
    endpoint: string
  ) => void;
  onUpdateRegionApiKey: (
    accountId: string,
    regionId: string,
    apiKey: string
  ) => void;
  onUpdateRegionDeploymentModel?: (
    accountId: string,
    regionId: string,
    modelName: string,
    patch: Partial<RegionDeploymentModelConfig>
  ) => void;
  onUpdateRegionEnabled: (
    accountId: string,
    regionId: string,
    enabled: boolean
  ) => void;
  onReorderAccounts?: (oldIndex: number, newIndex: number) => void;
  onReorderRegions?: (
    accountId: string,
    oldIndex: number,
    newIndex: number
  ) => void;
  onCopy: (text: string, label: string) => void;
}

export const AccountsSection: React.FC<AccountsSectionProps> = ({
  accounts,
  masterGroups,
  masterGroupLines,
  masterModels,
  filteredModels,
  modelFilterInput,
  privacyMode = false,
  onFilterChange,
  onAddAccount,
  onExportConfig,
  onImportConfig,
  onRenumberAccounts,
  onUpdateAccountName,
  onUpdateAccountNote,
  onUpdateAccountEnabled,
  onUpdateAccountIncludeInStats,
  onUpdateAccountTier,
  onUpdateAccountQuota,
  onUpdateAccountPurchase,
  onUpdateAccountUsedAmount,
  onUpdateRegionDeployment,
  onDeleteAccount,
  onAddRegion,
  onDeleteRegion,
  onUpdateRegionName,
  onUpdateRegionModelsText,
  onUpdateRegionOpenaiEndpoint,
  onUpdateRegionFoundryProjectEndpoint,
  onUpdateRegionAiServicesEndpoint,
  onUpdateRegionAnthropicEndpoint,
  onUpdateRegionApiKey,
  onUpdateRegionDeploymentModel,
  onUpdateRegionEnabled,
  onReorderAccounts,
  onReorderRegions,
  onCopy,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [showExportWarning, setShowExportWarning] = useState(false);
  const [showRenumberConfirm, setShowRenumberConfirm] = useState(false);

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

  const handleRenumber = () => {
    setShowRenumberConfirm(false);
    if (onRenumberAccounts) {
      onRenumberAccounts();
      toast.success(t('toast.accountsRenumbered'));
    }
  };

  const handleImportClick = () => {
    if (!onImportConfig) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const jsonString = event.target?.result as string;
          const result = onImportConfig(jsonString);
          if (result.success) {
            toast.success(t('toast.configImported'));
          } else {
            toast.error(
              t('toast.configImportFailed') +
                (result.error ? `: ${result.error}` : '')
            );
          }
        };
        reader.onerror = () => {
          toast.error(t('toast.configImportFailed'));
        };
        reader.readAsText(file);
      }
    };
    input.click();
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

  // Filter accounts based on model search
  const filteredAccounts = useMemo(() => {
    if (!modelFilterInput.trim()) return sortedAccounts;

    return sortedAccounts.filter(({ account }) => {
      return account.regions.some((region) => {
        const models = parseModels(region.modelsText);
        return models.some((model) =>
          model.toLowerCase().includes(modelFilterInput.toLowerCase())
        );
      });
    });
  }, [sortedAccounts, modelFilterInput]);

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
      <section className="p-4 rounded-xl border border-border bg-background section-glow">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold mb-1">
              {t('accounts.title')}
            </h2>
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
            {onRenumberAccounts && accounts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRenumberConfirm(true)}
                className={clsx(
                  'px-3 py-1.5 rounded-full',
                  'border border-border bg-background text-foreground',
                  'text-xs cursor-pointer hover:bg-muted transition-colors'
                )}
                title={t('accounts.renumberTooltip')}
              >
                🔢 {t('accounts.renumberAccounts')}
              </button>
            )}
            {onImportConfig && (
              <button
                type="button"
                onClick={handleImportClick}
                className={clsx(
                  'px-3 py-1.5 rounded-full',
                  'border border-border bg-background text-foreground',
                  'text-xs cursor-pointer hover:bg-muted transition-colors'
                )}
              >
                {t('accounts.importConfig')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowExportWarning(true)}
              className={clsx(
                'px-3 py-1.5 rounded-full',
                'border border-border bg-background text-foreground',
                'text-xs cursor-pointer hover:bg-muted transition-colors'
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
              'border border-border bg-background text-foreground text-xs',
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
                'border border-border bg-background text-foreground',
                'text-xs cursor-pointer hover:bg-muted'
              )}
            >
              {t('common.clear')}
            </button>
          )}
        </div>

        {/* Accounts list with drag and drop */}
        {accounts.length === 0 ? (
          <EmptyState
            icon={<NoAccountIcon className="w-full h-full" />}
            title={t('emptyState.noAccounts')}
            description={t('emptyState.noAccountsDesc')}
            size="md"
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredAccounts.map((item) => item.account.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {filteredAccounts.map(({ account, originalIndex }) => (
                  <SortableAccountCard
                    key={account.id}
                    account={account}
                    index={originalIndex}
                    privacyMode={privacyMode}
                    masterGroups={masterGroups}
                    masterGroupLines={masterGroupLines}
                    masterModels={masterModels}
                    filteredModels={filteredModels}
                    onUpdateName={(name) =>
                      onUpdateAccountName(account.id, name)
                    }
                    onUpdateNote={(note) =>
                      onUpdateAccountNote(account.id, note)
                    }
                    onUpdateEnabled={(enabled) =>
                      onUpdateAccountEnabled(account.id, enabled)
                    }
                    onUpdateIncludeInStats={
                      onUpdateAccountIncludeInStats
                        ? (includeInStats) =>
                            onUpdateAccountIncludeInStats(
                              account.id,
                              includeInStats
                            )
                        : undefined
                    }
                    onUpdateTier={(tier) =>
                      onUpdateAccountTier(account.id, tier)
                    }
                    onUpdateQuota={(quota, customQuota) =>
                      onUpdateAccountQuota(account.id, quota, customQuota)
                    }
                    onUpdatePurchase={
                      onUpdateAccountPurchase
                        ? (amount, currency) =>
                            onUpdateAccountPurchase(
                              account.id,
                              amount,
                              currency
                            )
                        : undefined
                    }
                    onUpdateUsedAmount={
                      onUpdateAccountUsedAmount
                        ? (usedAmount) =>
                            onUpdateAccountUsedAmount(account.id, usedAmount)
                        : undefined
                    }
                    onUpdateRegionDeployment={
                      onUpdateRegionDeployment
                        ? (
                            regionId: string,
                            patch: Partial<RegionDeploymentConfig>
                          ) =>
                            onUpdateRegionDeployment(
                              account.id,
                              regionId,
                              patch
                            )
                        : undefined
                    }
                    onDelete={() => onDeleteAccount(account.id)}
                    onAddRegion={() => onAddRegion(account.id)}
                    onDeleteRegion={(regionId) =>
                      onDeleteRegion(account.id, regionId)
                    }
                    onUpdateRegionName={(regionId, name) =>
                      onUpdateRegionName(account.id, regionId, name)
                    }
                    onUpdateRegionModelsText={(regionId, text) =>
                      onUpdateRegionModelsText(account.id, regionId, text)
                    }
                    onUpdateRegionOpenaiEndpoint={(regionId, endpoint) =>
                      onUpdateRegionOpenaiEndpoint(
                        account.id,
                        regionId,
                        endpoint
                      )
                    }
                    onUpdateRegionFoundryProjectEndpoint={
                      onUpdateRegionFoundryProjectEndpoint
                        ? (regionId: string, endpoint: string) =>
                            onUpdateRegionFoundryProjectEndpoint(
                              account.id,
                              regionId,
                              endpoint
                            )
                        : undefined
                    }
                    onUpdateRegionAiServicesEndpoint={
                      onUpdateRegionAiServicesEndpoint
                        ? (regionId: string, endpoint: string) =>
                            onUpdateRegionAiServicesEndpoint(
                              account.id,
                              regionId,
                              endpoint
                            )
                        : undefined
                    }
                    onUpdateRegionAnthropicEndpoint={(regionId, endpoint) =>
                      onUpdateRegionAnthropicEndpoint(
                        account.id,
                        regionId,
                        endpoint
                      )
                    }
                    onUpdateRegionApiKey={(regionId, apiKey) =>
                      onUpdateRegionApiKey(account.id, regionId, apiKey)
                    }
                    onUpdateRegionDeploymentModel={
                      onUpdateRegionDeploymentModel
                        ? (
                            regionId: string,
                            modelName: string,
                            patch: Partial<RegionDeploymentModelConfig>
                          ) =>
                            onUpdateRegionDeploymentModel(
                              account.id,
                              regionId,
                              modelName,
                              patch
                            )
                        : undefined
                    }
                    onUpdateRegionEnabled={(regionId, enabled) =>
                      onUpdateRegionEnabled(account.id, regionId, enabled)
                    }
                    onReorderRegions={
                      onReorderRegions
                        ? (oldIndex, newIndex) =>
                            onReorderRegions(account.id, oldIndex, newIndex)
                        : undefined
                    }
                    onCopy={onCopy}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
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

      {/* Renumber confirmation */}
      <ConfirmDialog
        open={showRenumberConfirm}
        onOpenChange={setShowRenumberConfirm}
        title={t('accounts.renumberConfirmTitle')}
        description={t('accounts.renumberConfirmDesc')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        variant="warning"
        onConfirm={handleRenumber}
      />
    </>
  );
};

AccountsSection.displayName = 'AccountsSection';
