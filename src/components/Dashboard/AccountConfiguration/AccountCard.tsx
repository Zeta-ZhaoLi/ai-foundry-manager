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
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { SortableRegionCard } from './SortableRegionCard';
import {
  AccountTier,
  AccountQuota,
  CurrencyType,
  type GeneratedRegionIdentityBundle,
  RegionDeploymentConfig,
  RegionDeploymentModelConfig,
} from '../../../hooks/useLocalAzureAccounts';
import type { LocalAccount as ImportedLocalAccount } from '../../../hooks/useLocalAzureAccounts';
import { useToast } from '../../../hooks/useToast';
import { orderModelsByMaster, parseModels } from '../../../utils/common';
import {
  buildAzureCliMultiRegionDeploymentScript,
  getAzureCliDeploymentIdentity,
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
  onUpdateNote: (note: string) => void;
  onUpdateEnabled: (enabled: boolean) => void;
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
  onCopy: (text: string, label: string) => void;
}

// Quota options
const QUOTA_OPTIONS: { value: AccountQuota; label: string }[] = [
  { value: '200', label: '$200' },
  { value: '1000', label: '$1,000' },
  { value: '2000', label: '$2,000' },
  { value: '5000', label: '$5,000' },
  { value: '20000', label: '$20,000' },
  { value: '25000', label: '$25,000' },
  { value: '45000', label: '$45,000' },
  { value: 'custom', label: '' }, // label will use i18n
];

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
  onUpdateNote,
  onUpdateEnabled,
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
  onCopy,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(account.enabled);

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

  const displayNote = privacyMode ? '***' : account.note;

  const firstRegionResourceGroupName = useMemo(() => {
    const firstRegion = account.regions.find((region) =>
      (region.deployment?.resourceName || '').trim()
    );
    if (!firstRegion) return '';

    const identity = getAzureCliDeploymentIdentity({
      subscriptionId: account.subscriptionId || '00000000-0000-0000-0000-000000000000',
      resourceName: firstRegion.deployment?.resourceName || '',
      foundryProjectEndpoint: firstRegion.foundryProjectEndpoint || '',
      models: [
        {
          deploymentName: 'placeholder',
          modelName: 'placeholder',
          modelFormat: 'OpenAI',
          version: '1',
        },
      ],
    });

    return identity?.resourceGroup || '';
  }, [account.regions, account.subscriptionId]);

  const handleAllRegionsAzureCliDeployCode = (mode: 'selected' | 'all') => {
    if (!account.subscriptionId?.trim()) {
      toast.error(t('regions.deployMissingSubscriptionId'));
      return;
    }
    if (!firstRegionResourceGroupName) {
      toast.error(t('regions.deployMissingFirstRegionResourceGroup'));
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
          resourceGroupName: firstRegionResourceGroupName,
          foundryProjectEndpoint: region.foundryProjectEndpoint || '',
          label:
            region.name ||
            `${t('regions.region')} ${regionIndex + 1}`,
          models: toAzureCliDeploymentModels(
            resolveAzureCliDeploymentRows(
              sourceModels,
              region.deployment?.models || {}
            )
          ),
        };
      })
      .filter((target) => target.resourceName && target.models.length > 0);

    if (targets.length === 0) {
      toast.error(
        mode === 'selected'
          ? t('regions.deployNoEnabledModels')
          : t('regions.deployNoDeployableRegions')
      );
      return;
    }

    try {
      const script = buildAzureCliMultiRegionDeploymentScript({
        subscriptionId: account.subscriptionId,
        resourceGroupName: firstRegionResourceGroupName,
        targets,
      });
      onCopy(
        script,
        `${displayName} - ${t('regions.azureCliDeployAllRegionsCode')} ${
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
          'rounded-xl border border-border p-3',
          'bg-gradient-to-br from-white to-slate-50 dark:from-slate-950/90 dark:to-slate-950/70',
          'shadow-lg',
          account.enabled ? 'opacity-100' : 'opacity-60'
        )}
      >
        {/* Account header */}
        <div className="mb-2">
          {/* Summary and fixed account actions */}
          <div className="flex items-center justify-between mb-2 gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {/* Account ID badge */}
              {account.accountId && (
                <span
                  title={t('accounts.accountId')}
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-mono font-bold whitespace-nowrap shrink-0',
                    account.tier === 'premium'
                      ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
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
            <div className="flex items-center gap-2 shrink-0">
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
                  onChange={(e) =>
                    handleAccountEnabledChange(e.target.checked)
                  }
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Tier and account ID */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">
                {t('accounts.tier')}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={account.tier || 'standard'}
                  onChange={(e) =>
                    onUpdateTier?.(e.target.value as AccountTier)
                  }
                  className={clsx(
                    'flex-1 px-2 py-1.5 rounded-lg',
                    'border border-border bg-background text-foreground text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    'cursor-pointer'
                  )}
                >
                  <option value="premium">
                    ⭐ {t('accounts.tierPremium')}
                  </option>
                  <option value="standard">{t('accounts.tierStandard')}</option>
                </select>
                {/* Account ID badge */}
                {account.accountId && (
                  <span
                    title={t('accounts.accountIdTooltip')}
                    className={clsx(
                      'px-2 py-1 rounded text-xs font-mono font-bold whitespace-nowrap',
                      account.tier === 'premium'
                        ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                        : 'bg-muted text-muted-foreground border border-border'
                    )}
                  >
                    {privacyMode
                      ? account.accountId.replace(/\d/g, 'X')
                      : account.accountId}
                  </span>
                )}
              </div>
            </div>

            {/* Account name */}
            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground block mb-1">
                {t('accounts.accountName')}
              </label>
              <input
                className={clsx(
                  'w-full p-1.5 rounded-lg',
                  'border border-border bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={privacyMode ? displayName : account.name}
                onChange={(e) => onUpdateName(e.target.value)}
                placeholder={t('accounts.accountNamePlaceholder')}
                disabled={privacyMode}
              />
            </div>

            {/* Azure Subscription ID */}
            <div className="md:col-span-3">
              <label className="text-xs text-muted-foreground block mb-1">
                {t('accounts.subscriptionId')}
              </label>
              <input
                className={clsx(
                  'w-full p-1.5 rounded-lg',
                  'border border-border bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={privacyMode ? '***' : account.subscriptionId || ''}
                onChange={(e) => onUpdateSubscriptionId?.(e.target.value)}
                placeholder={t('accounts.subscriptionIdPlaceholder')}
                disabled={privacyMode || !onUpdateSubscriptionId}
              />
            </div>

            {/* Quota */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">
                {t('accounts.quota')}
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={account.quota || '200'}
                  onChange={(e) =>
                    onUpdateQuota?.(e.target.value as AccountQuota)
                  }
                  className={clsx(
                    'flex-1 px-2 py-1.5 rounded-lg',
                    'border border-border bg-background text-foreground text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    'cursor-pointer'
                  )}
                >
                  {QUOTA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value === 'custom'
                        ? t('accounts.quotaCustom')
                        : opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom quota */}
            {account.quota === 'custom' && (
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground block mb-1">
                  $
                </label>
                <input
                  type="number"
                  value={account.customQuota || ''}
                  onChange={(e) =>
                    onUpdateQuota?.('custom', Number(e.target.value))
                  }
                  placeholder="0"
                  className={clsx(
                    'w-full p-1.5 rounded-lg',
                    'border border-border bg-background text-foreground text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  )}
                />
              </div>
            )}

            {/* Note */}
            <div
              className={
                account.quota === 'custom' ? 'md:col-span-1' : 'md:col-span-2'
              }
            >
              <label className="text-xs text-muted-foreground block mb-1">
                {t('accounts.note')}
              </label>
              <input
                className={clsx(
                  'w-full p-1.5 rounded-lg',
                  'border border-gray-700 bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={privacyMode ? displayNote : account.note || ''}
                onChange={(e) => onUpdateNote(e.target.value)}
                placeholder={t('accounts.notePlaceholder')}
                disabled={privacyMode}
              />
            </div>
          </div>

          {/* Purchase and usage fields */}
          {!privacyMode && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
              {/* Purchase amount */}
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.purchaseAmount')}
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={account.purchaseCurrency || 'USD'}
                    onChange={(e) =>
                      onUpdatePurchase?.(
                        account.purchaseAmount || 0,
                        e.target.value as CurrencyType
                      )
                    }
                    className={clsx(
                      'px-2 py-1.5 rounded-lg',
                      'border border-gray-700 bg-background text-foreground text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                      'cursor-pointer'
                    )}
                  >
                    <option value="USD">$</option>
                    <option value="CNY">¥</option>
                  </select>
                  <input
                    type="number"
                    value={account.purchaseAmount || ''}
                    onChange={(e) =>
                      onUpdatePurchase?.(
                        Number(e.target.value),
                        account.purchaseCurrency || 'USD'
                      )
                    }
                    placeholder="0"
                    className={clsx(
                      'flex-1 p-1.5 rounded-lg',
                      'border border-gray-700 bg-background text-foreground text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                    )}
                  />
                </div>
              </div>

              {/* Used quota */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.usedAmount')}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={account.usedAmount ?? ''}
                    onChange={(e) =>
                      onUpdateUsedAmount?.(Number(e.target.value))
                    }
                    placeholder="0"
                    className={clsx(
                      'flex-1 p-1.5 rounded-lg',
                      'border border-gray-700 bg-background text-foreground text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                    )}
                  />
                </div>
              </div>

              {/* Account cost */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.accountCost')}
                </label>
                <div className="p-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-sm text-muted-foreground">
                  {(() => {
                    const quota =
                      account.quota === 'custom'
                        ? account.customQuota || 0
                        : Number(account.quota || 200);
                    if (quota === 0 || !account.purchaseAmount) return '-';
                    const cost = account.purchaseAmount / quota;
                    const symbol =
                      account.purchaseCurrency === 'CNY' ? '¥' : '$';
                    return `${symbol}${cost.toFixed(2)}`;
                  })()}
                </div>
              </div>

              {/* Actual cost */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.actualCost')}
                </label>
                <div className="p-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-sm text-muted-foreground">
                  {(() => {
                    const used = account.usedAmount || 0;
                    if (used === 0 || !account.purchaseAmount) return '-';
                    const cost = account.purchaseAmount / used;
                    const symbol =
                      account.purchaseCurrency === 'CNY' ? '¥' : '$';
                    return `${symbol}${cost.toFixed(2)}`;
                  })()}
                </div>
              </div>

              {/* Usage rate */}
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.usageRate')}
                </label>
                {(() => {
                  const quota =
                    account.quota === 'custom'
                      ? account.customQuota || 0
                      : Number(account.quota || 200);
                  const used = account.usedAmount || 0;
                  if (quota === 0)
                    return <div className="text-xs text-gray-500">-</div>;
                  const pct = Math.round((used / quota) * 100);
                  const displayPct = Math.min(pct, 100);
                  return (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-cyan-500"
                          style={{ width: `${displayPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        ${used}/${quota} ({pct}%)
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Regions */}
        {isExpanded && (
          <div className="mb-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium">{t('regions.regionList')}</div>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'inline-flex items-center rounded-full border text-xs overflow-hidden',
                  privacyMode || account.regions.length === 0
                    ? 'border-gray-700 bg-gray-900/40 text-gray-500'
                    : 'border-emerald-500 bg-emerald-900/20 text-emerald-200'
                )}
              >
                <span className="px-2 py-0.5 border-r border-current/30">
                  {t('regions.azureCliDeployAllRegionsCode')} (
                </span>
                <button
                  type="button"
                  disabled={privacyMode || account.regions.length === 0}
                  aria-label={`${t('regions.azureCliDeployAllRegionsCode')} ${t(
                    'regions.azureCliDeploySelected'
                  )}`}
                  onClick={() => handleAllRegionsAzureCliDeployCode('selected')}
                  className={clsx(
                    'px-1.5 py-0.5 transition-colors',
                    privacyMode || account.regions.length === 0
                      ? 'cursor-not-allowed text-gray-500'
                      : 'cursor-pointer hover:bg-emerald-900/40'
                  )}
                >
                  {t('regions.azureCliDeploySelected')}
                </button>
                <span className="text-current/60">|</span>
                <button
                  type="button"
                  disabled={privacyMode || account.regions.length === 0}
                  aria-label={`${t('regions.azureCliDeployAllRegionsCode')} ${t(
                    'regions.azureCliDeployAll'
                  )}`}
                  onClick={() => handleAllRegionsAzureCliDeployCode('all')}
                  className={clsx(
                    'px-1.5 py-0.5 transition-colors',
                    privacyMode || account.regions.length === 0
                      ? 'cursor-not-allowed text-gray-500'
                      : 'cursor-pointer hover:bg-emerald-900/40'
                  )}
                >
                  {t('regions.azureCliDeployAll')}
                </button>
                <span className="px-2 py-0.5 border-l border-current/30">
                  )
                </span>
              </div>
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
                      accountId={account.id}
                      accountName={displayName}
                      subscriptionId={account.subscriptionId || ''}
                      azureCliResourceGroupName={firstRegionResourceGroupName}
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
                              onApplyGeneratedRegionIdentity(region.id, bundle)
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
