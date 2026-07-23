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
import { AccountBillingFields } from './AccountBillingFields';
import { AccountIdentitySection } from './AccountIdentitySection';
import { AccountServicePrincipalSection } from './AccountServicePrincipalSection';
import { AccountUsageSection } from './AccountUsageSection';
import { SortableRegionCard } from './SortableRegionCard';
import {
  AccountTier,
  AccountQuota,
  CurrencyType,
  type ServicePrincipalCredential,
  type GeneratedRegionIdentityBundle,
  RegionDeploymentConfig,
  RegionDeploymentModelConfig,
} from '../../../hooks/useLocalAzureAccounts';
import type { LocalAccount as ImportedLocalAccount } from '../../../hooks/useLocalAzureAccounts';
import { useToast } from '../../../hooks/useToast';
import { orderModelsByMaster, parseModels } from '../../../utils/common';
import {
  buildAzureCliPowerShellMultiRegionDeploymentScript,
  buildAzureCliMultiRegionDeploymentScript,
  resolveAzureCliDeploymentRows,
  toAzureCliDeploymentModels,
} from '../../../utils/azureCliDeployment';
export type LocalAccount = ImportedLocalAccount;

export interface AccountCardProps {
  account: LocalAccount;
  index?: number;
  privacyMode?: boolean;
  masterGroups: string[][];
  masterGroupLines: string[][][];
  masterModels: string[];
  filteredModels: string[];
  onUpdateName: (name: string) => void;
  onUpdateSubscriptionId?: (subscriptionId: string) => void;
  onUpdateResourceGroupName?: (resourceGroupName: string) => void;
  onUpdateServicePrincipal?: (
    servicePrincipal?: ServicePrincipalCredential
  ) => void;
  onUpdateNote: (note: string) => void;
  onUpdateEnabled: (enabled: boolean) => void;
  onUpdateAvailable?: (available: boolean) => void;
  onUpdateIncludeInStats?: (includeInStats: boolean) => void;
  onUpdateTier?: (tier: AccountTier) => void;
  onUpdateQuota?: (quota: AccountQuota, customQuota?: number) => void;
  onUpdatePurchase?: (amount: number, currency: CurrencyType) => void;
  onUpdateUsedAmount?: (usedAmount: number) => void;
  onDelete: () => void;
  onAddRegion: () => void;
  onDeleteRegion: (regionId: string) => void;
  onUpdateRegionName: (regionId: string, name: string) => void;
  onUpdateRegionModelsText: (regionId: string, text: string) => void;
  onUpdateRegionOpenaiEndpoint: (regionId: string, endpoint: string) => void;
  onUpdateRegionFoundryProjectEndpoint?: (
    regionId: string,
    endpoint: string
  ) => void;
  onUpdateRegionAiServicesEndpoint?: (
    regionId: string,
    endpoint: string
  ) => void;
  onUpdateRegionAnthropicEndpoint: (regionId: string, endpoint: string) => void;
  onUpdateRegionApiKey: (regionId: string, apiKey: string) => void;
  onUpdateRegionDeployment?: (
    regionId: string,
    patch: Partial<RegionDeploymentConfig>
  ) => void;
  onApplyGeneratedRegionIdentity?: (
    regionId: string,
    bundle: GeneratedRegionIdentityBundle
  ) => void;
  onUpdateRegionDeploymentModel?: (
    regionId: string,
    modelName: string,
    patch: Partial<RegionDeploymentModelConfig>
  ) => void;
  onUpdateRegionEnabled: (regionId: string, enabled: boolean) => void;
  onReorderRegions?: (oldIndex: number, newIndex: number) => void;
  initiallyExpanded?: boolean;
  onCopy: (text: string, label: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  index = 0,
  privacyMode = false,
  masterGroups,
  masterGroupLines,
  masterModels,
  filteredModels,
  onUpdateName,
  onUpdateSubscriptionId,
  onUpdateResourceGroupName,
  onUpdateServicePrincipal,
  onUpdateNote,
  onUpdateEnabled,
  onUpdateAvailable,
  onUpdateIncludeInStats,
  onUpdateTier,
  onUpdateQuota,
  onUpdatePurchase,
  onUpdateUsedAmount,
  onDelete,
  onAddRegion,
  onDeleteRegion,
  onUpdateRegionName,
  onUpdateRegionModelsText,
  onUpdateRegionOpenaiEndpoint,
  onUpdateRegionFoundryProjectEndpoint,
  onUpdateRegionAiServicesEndpoint,
  onUpdateRegionAnthropicEndpoint,
  onUpdateRegionApiKey,
  onUpdateRegionDeployment,
  onApplyGeneratedRegionIdentity,
  onUpdateRegionDeploymentModel,
  onUpdateRegionEnabled,
  onReorderRegions,
  initiallyExpanded,
  onCopy,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    initiallyExpanded ?? account.enabled !== false
  );
  const [overwriteAzureCliDeployments, setOverwriteAzureCliDeployments] =
    useState(false);

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

  // Display values in privacy mode.
  const displayName = privacyMode
    ? t('accounts.account') + ` ${index + 1}`
    : account.name || t('accounts.account') + ` ${index + 1}`;

  const resourceGroupName = account.resourceGroupName?.trim() || '';

  const handleAllRegionsAzureCliDeployCode = (
    mode: 'selected' | 'all',
    shell: 'bash' | 'powershell' = 'bash'
  ) => {
    if (!resourceGroupName) {
      toast.error(t('regions.deployMissingResourceGroupName'));
      return;
    }
    if (masterModels.length === 0) {
      toast.error(t('regions.deployNoMasterModels'));
      return;
    }

    const targets = account.regions
      .filter((region) => region.enabled !== false)
      .map((region, regionIndex) => {
        const resourceName = region.deployment?.resourceName?.trim() || '';
        const sourceModels =
          mode === 'selected'
            ? orderModelsByMaster(parseModels(region.modelsText), masterModels)
            : masterModels;
        return {
          resourceName,
          location: region.name || '',
          resourceGroupName,
          foundryProjectEndpoint: region.foundryProjectEndpoint || '',
          label: region.name || `${t('regions.region')} ${regionIndex + 1}`,
          models: toAzureCliDeploymentModels(
            resolveAzureCliDeploymentRows(
              sourceModels,
              region.deployment?.models || {}
            )
          ),
        };
      })
      .filter(
        (target) =>
          target.resourceName && target.location && target.models.length > 0
      );

    if (targets.length === 0) {
      toast.error(
        mode === 'selected'
          ? t('regions.deployNoEnabledModels')
          : t('regions.deployNoDeployableRegions')
      );
      return;
    }

    try {
      const input = {
        accountId: account.accountId,
        subscriptionId: account.subscriptionId,
        servicePrincipal: account.servicePrincipal,
        accountEmail: account.name,
        resourceGroupName,
        targets,
        overwriteExisting: overwriteAzureCliDeployments,
      };
      const script =
        shell === 'powershell'
          ? buildAzureCliPowerShellMultiRegionDeploymentScript(input)
          : buildAzureCliMultiRegionDeploymentScript(input);
      onCopy(
        script,
        `${displayName} - ${t(
          shell === 'powershell'
            ? 'regions.azureCliDeployPowerShellCode'
            : 'regions.azureCliDeployAllRegionsCode'
        )} ${
          mode === 'selected'
            ? t('regions.azureCliDeploySelected')
            : t('regions.azureCliDeployAll')
        }`
      );
      toast.success(t('regions.azureCliDeployAllRegionsCodeCopied'));
    } catch (e: unknown) {
      toast.error(
        t('regions.deployFailed', {
          msg: e instanceof Error ? e.message : String(e),
        })
      );
    }
  };

  const handleAccountEnabledChange = (enabled: boolean) => {
    onUpdateEnabled(enabled);
    setIsExpanded(enabled);
  };

  return (
    <>
      <div
        className={clsx(
          'rounded-md border border-border bg-background p-3 shadow-sm',
          account.enabled ? 'opacity-100' : 'opacity-60'
        )}
      >
        {/* Account header */}
        <div className="mb-2">
          {/* Summary and fixed account actions */}
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Account ID badge */}
              {account.accountId && (
                <span
                  title={t('accounts.accountId')}
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap shrink-0',
                    account.tier === 'premium'
                      ? 'border border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {privacyMode
                    ? account.accountId.replace(/\d/g, 'X')
                    : account.accountId}
                </span>
              )}
              {/* Account name */}
              <span className="text-sm font-medium truncate">
                {displayName}
              </span>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg whitespace-nowrap',
                  'border border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-300',
                  'text-xs cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50'
                )}
              >
                {t('accounts.deleteAccount')}
              </button>
              {/* Account availability */}
              <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={account.available === true}
                  onChange={(e) => onUpdateAvailable?.(e.target.checked)}
                  className="cursor-pointer"
                />
                <span>{t('accounts.available')}</span>
              </label>
              {/* Account-level statistics */}
              <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={account.includeInStats !== false}
                  onChange={(e) => onUpdateIncludeInStats?.(e.target.checked)}
                  className="cursor-pointer"
                />
                <span>{t('accounts.includeInStats')}</span>
              </label>
              {/* Model-level statistics */}
              <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={account.enabled}
                  onChange={(e) => handleAccountEnabledChange(e.target.checked)}
                  className="cursor-pointer"
                />
                <span>{t('accounts.enableModels')}</span>
              </label>
              {/* Expand or collapse */}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="px-2 py-0.5 rounded-full border border-border bg-background text-foreground text-xs cursor-pointer hover:bg-muted whitespace-nowrap"
              >
                {isExpanded ? t('accounts.collapse') : t('accounts.expand')}
              </button>
            </div>
          </div>

          {isExpanded && (
            <>
              {/* Account detail fields */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                <AccountIdentitySection
                  account={account}
                  privacyMode={privacyMode}
                  displayName={displayName}
                  onUpdateName={onUpdateName}
                  onUpdateSubscriptionId={onUpdateSubscriptionId}
                  onUpdateResourceGroupName={onUpdateResourceGroupName}
                  onUpdateTier={onUpdateTier}
                />
                <AccountServicePrincipalSection
                  servicePrincipal={account.servicePrincipal}
                  privacyMode={privacyMode}
                  onUpdate={onUpdateServicePrincipal}
                  onCopy={onCopy}
                />
                <AccountBillingFields
                  account={account}
                  privacyMode={privacyMode}
                  onUpdateNote={onUpdateNote}
                  onUpdateQuota={onUpdateQuota}
                />
              </div>

              {/* Purchase and usage fields */}
              <AccountUsageSection
                account={account}
                privacyMode={privacyMode}
                onUpdatePurchase={onUpdatePurchase}
                onUpdateUsedAmount={onUpdateUsedAmount}
              />
            </>
          )}
        </div>

        {/* Regions */}
        {isExpanded && (
          <div className="mb-1.5">
            <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
              <div className="shrink-0 text-sm font-medium">
                {t('regions.regionList')}
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <label
                  className={clsx(
                    'inline-flex items-center gap-1.5 text-xs',
                    privacyMode
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-muted-foreground cursor-pointer'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={overwriteAzureCliDeployments}
                    disabled={privacyMode}
                    onChange={(e) =>
                      setOverwriteAzureCliDeployments(e.target.checked)
                    }
                    className="h-3.5 w-3.5"
                  />
                  <span>{t('regions.azureCliOverwriteExisting')}</span>
                </label>
                <div
                  className={clsx(
                    'flex max-w-full flex-wrap items-center gap-1 whitespace-nowrap rounded-lg border p-1 text-xs',
                    privacyMode || account.regions.length === 0
                      ? 'border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'
                      : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                  )}
                >
                  <span className="shrink-0 px-1 text-current/80">
                    {t('regions.azureCliDeployAllRegionsCode')}
                  </span>
                  <button
                    type="button"
                    disabled={privacyMode || account.regions.length === 0}
                    aria-label={`${t('regions.azureCliDeployAllRegionsCode')} ${t(
                      'regions.azureCliDeploySelected'
                    )}`}
                    onClick={() =>
                      handleAllRegionsAzureCliDeployCode('selected')
                    }
                    className={clsx(
                      'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                      privacyMode || account.regions.length === 0
                        ? 'cursor-not-allowed text-gray-500'
                        : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    )}
                  >
                    {t('regions.azureCliDeploySelected')}
                  </button>
                  <button
                    type="button"
                    disabled={privacyMode || account.regions.length === 0}
                    aria-label={`${t('regions.azureCliDeployAllRegionsCode')} ${t(
                      'regions.azureCliDeployAll'
                    )}`}
                    onClick={() => handleAllRegionsAzureCliDeployCode('all')}
                    className={clsx(
                      'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                      privacyMode || account.regions.length === 0
                        ? 'cursor-not-allowed text-gray-500'
                        : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    )}
                  >
                    {t('regions.azureCliDeployAll')}
                  </button>
                  <button
                    type="button"
                    disabled={privacyMode || account.regions.length === 0}
                    aria-label={`${t(
                      'regions.azureCliDeployPowerShellCode'
                    )} ${t('regions.azureCliDeploySelected')}`}
                    onClick={() =>
                      handleAllRegionsAzureCliDeployCode(
                        'selected',
                        'powershell'
                      )
                    }
                    className={clsx(
                      'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                      privacyMode || account.regions.length === 0
                        ? 'cursor-not-allowed text-gray-500'
                        : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    )}
                  >
                    PS {t('regions.azureCliDeploySelected')}
                  </button>
                  <button
                    type="button"
                    disabled={privacyMode || account.regions.length === 0}
                    aria-label={`${t('regions.azureCliDeployPowerShellCode')} ${t(
                      'regions.azureCliDeployAll'
                    )}`}
                    onClick={() =>
                      handleAllRegionsAzureCliDeployCode('all', 'powershell')
                    }
                    className={clsx(
                      'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                      privacyMode || account.regions.length === 0
                        ? 'cursor-not-allowed text-gray-500'
                        : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    )}
                  >
                    PS {t('regions.azureCliDeployAll')}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onAddRegion}
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full',
                    'border border-cyan-500 bg-cyan-50 text-cyan-700',
                    'text-xs cursor-pointer hover:bg-cyan-100 dark:bg-slate-900 dark:text-cyan-200 dark:hover:bg-slate-800'
                  )}
                >
                  + {t('regions.addRegion')}
                </button>
              </div>
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
                    {account.regions.map((region, regionIndex) => (
                      <SortableRegionCard
                        key={region.id}
                        region={region}
                        regionIndex={regionIndex}
                        privacyMode={privacyMode}
                        accountId={account.accountId}
                        accountName={displayName}
                        subscriptionId={account.subscriptionId || ''}
                        servicePrincipal={account.servicePrincipal}
                        azureCliResourceGroupName={resourceGroupName}
                        masterGroups={masterGroups}
                        masterGroupLines={masterGroupLines}
                        masterModels={masterModels}
                        filteredModels={filteredModels}
                        onUpdateName={(name) =>
                          onUpdateRegionName(region.id, name)
                        }
                        onUpdateModelsText={(text) =>
                          onUpdateRegionModelsText(region.id, text)
                        }
                        onUpdateOpenaiEndpoint={(endpoint) =>
                          onUpdateRegionOpenaiEndpoint(region.id, endpoint)
                        }
                        onUpdateFoundryProjectEndpoint={
                          onUpdateRegionFoundryProjectEndpoint
                            ? (endpoint: string) =>
                                onUpdateRegionFoundryProjectEndpoint(
                                  region.id,
                                  endpoint
                                )
                            : undefined
                        }
                        onUpdateAiServicesEndpoint={
                          onUpdateRegionAiServicesEndpoint
                            ? (endpoint: string) =>
                                onUpdateRegionAiServicesEndpoint(
                                  region.id,
                                  endpoint
                                )
                            : undefined
                        }
                        onUpdateAnthropicEndpoint={(endpoint) =>
                          onUpdateRegionAnthropicEndpoint(region.id, endpoint)
                        }
                        onUpdateApiKey={(apiKey) =>
                          onUpdateRegionApiKey(region.id, apiKey)
                        }
                        onUpdateDeployment={
                          onUpdateRegionDeployment
                            ? (patch) =>
                                onUpdateRegionDeployment(region.id, patch)
                            : undefined
                        }
                        onApplyGeneratedIdentity={
                          onApplyGeneratedRegionIdentity
                            ? (bundle) =>
                                onApplyGeneratedRegionIdentity(
                                  region.id,
                                  bundle
                                )
                            : undefined
                        }
                        siblingResourceNames={account.regions
                          .filter((item) => item.id !== region.id)
                          .map((item) => item.deployment?.resourceName || '')}
                        onUpdateDeploymentModel={
                          onUpdateRegionDeploymentModel
                            ? (modelName, patch) =>
                                onUpdateRegionDeploymentModel(
                                  region.id,
                                  modelName,
                                  patch
                                )
                            : undefined
                        }
                        onUpdateEnabled={(enabled) =>
                          onUpdateRegionEnabled(region.id, enabled)
                        }
                        onDelete={() => onDeleteRegion(region.id)}
                        onCopy={onCopy}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}
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
