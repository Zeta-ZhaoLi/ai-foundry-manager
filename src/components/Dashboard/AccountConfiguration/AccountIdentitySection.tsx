import { useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { useToast } from '../../../hooks/useToast';
import type { AccountTier, LocalAccount } from '../../../schemas/account';
import { getAzureCliDeploymentIdentity } from '../../../utils/azureCliDeployment';

export interface AccountIdentitySectionProps {
  account: LocalAccount;
  privacyMode: boolean;
  displayName: string;
  onUpdateName: (name: string) => void;
  onUpdateSubscriptionId?: (subscriptionId: string) => void;
  onUpdateResourceGroupName?: (resourceGroupName: string) => void;
  onUpdateTier?: (tier: AccountTier) => void;
}

export function AccountIdentitySection({
  account,
  privacyMode,
  displayName,
  onUpdateName,
  onUpdateSubscriptionId,
  onUpdateResourceGroupName,
  onUpdateTier,
}: AccountIdentitySectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const generatedResourceGroupName = useMemo(() => {
    const firstRegion = account.regions.find((region) =>
      (region.deployment?.resourceName || '').trim()
    );
    if (!firstRegion) return '';

    const identity = getAzureCliDeploymentIdentity({
      subscriptionId:
        account.subscriptionId || '00000000-0000-0000-0000-000000000000',
      resourceName: firstRegion.deployment?.resourceName || '',
      location: firstRegion.name || '',
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

  const handleGenerateResourceGroupName = () => {
    if (!generatedResourceGroupName) {
      toast.error(t('regions.deployMissingFirstRegionResourceGroup'));
      return;
    }
    onUpdateResourceGroupName?.(generatedResourceGroupName);
    toast.success(t('accounts.resourceGroupGenerated'));
  };

  return (
    <>
      {/* Tier and account ID */}
      <div className="lg:col-span-2">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('accounts.tier')}
        </label>
        <div className="flex items-center gap-2">
          <select
            value={account.tier || 'standard'}
            onChange={(e) => onUpdateTier?.(e.target.value as AccountTier)}
            className={clsx(
              'flex-1 px-2 py-1.5 rounded-lg',
              'border border-border bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'cursor-pointer'
            )}
          >
            <option value="premium">⭐ {t('accounts.tierPremium')}</option>
            <option value="standard">{t('accounts.tierStandard')}</option>
          </select>
          {/* Account ID badge */}
          {account.accountId && (
            <span
              title={t('accounts.accountIdTooltip')}
              className={clsx(
                'px-2 py-1 rounded text-xs font-mono font-bold whitespace-nowrap',
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
        </div>
      </div>

      {/* Account name */}
      <div className="lg:col-span-3">
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
      <div className="lg:col-span-2">
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

      {/* Azure Resource Group */}
      <div className="lg:col-span-3">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('accounts.resourceGroupName')}
        </label>
        <div className="flex items-center gap-1">
          <input
            className={clsx(
              'flex-1 min-w-0 p-1.5 rounded-lg',
              'border border-border bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={privacyMode ? '***' : account.resourceGroupName || ''}
            onChange={(e) => onUpdateResourceGroupName?.(e.target.value)}
            placeholder={t('accounts.resourceGroupNamePlaceholder')}
            disabled={privacyMode || !onUpdateResourceGroupName}
          />
          <button
            type="button"
            disabled={privacyMode || !onUpdateResourceGroupName}
            onClick={handleGenerateResourceGroupName}
            className={clsx(
              'px-2 py-1.5 rounded-lg border text-xs whitespace-nowrap',
              privacyMode || !onUpdateResourceGroupName
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'
                : 'border-cyan-500 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-200 dark:hover:bg-cyan-900/30'
            )}
          >
            {t('accounts.generateResourceGroupName')}
          </button>
        </div>
      </div>

      {/* Service Principal */}
    </>
  );
}
