import { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { useToast } from '../../../hooks/useToast';
import type { ServicePrincipalCredential } from '../../../schemas/account';
import { parseServicePrincipalJson } from '../../../utils/servicePrincipal';

const SERVICE_PRINCIPAL_CREATE_COMMAND = [
  'SUBSCRIPTION_ID=$(az account show --query id -o tsv)',
  '',
  'az ad sp create-for-rbac \\',
  '  --name ai-foundry-manager-deploy \\',
  '  --role Contributor \\',
  '  --scopes /subscriptions/$SUBSCRIPTION_ID',
].join('\n');

export interface AccountServicePrincipalSectionProps {
  servicePrincipal?: ServicePrincipalCredential;
  privacyMode: boolean;
  onUpdate?: (servicePrincipal?: ServicePrincipalCredential) => void;
  onCopy: (text: string, label: string) => void;
}

export function AccountServicePrincipalSection({
  servicePrincipal,
  privacyMode,
  onUpdate,
  onCopy,
}: AccountServicePrincipalSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [servicePrincipalJson, setServicePrincipalJson] = useState('');

  const handleImportServicePrincipal = () => {
    const result = parseServicePrincipalJson(servicePrincipalJson);
    if (!result.success || !result.credential) {
      toast.error(
        t('accounts.servicePrincipalImportFailed', {
          msg: result.error || 'Invalid JSON',
        })
      );
      return;
    }
    onUpdate?.(result.credential);
    setServicePrincipalJson('');
    toast.success(t('accounts.servicePrincipalImported'));
  };

  const account = { servicePrincipal };
  const onUpdateServicePrincipal = onUpdate;

  return (
    <div className="lg:col-span-3">
      <label className="text-xs text-muted-foreground block mb-1">
        {t('accounts.servicePrincipal')}
      </label>
      <div className="flex items-center gap-1">
        <input
          className={clsx(
            'flex-1 min-w-0 p-1.5 rounded-lg',
            'border border-border bg-background text-foreground text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
          )}
          value={
            privacyMode
              ? account.servicePrincipal
                ? '***'
                : ''
              : servicePrincipalJson
          }
          onChange={(e) => setServicePrincipalJson(e.target.value)}
          placeholder={t('accounts.servicePrincipalJsonPlaceholder')}
          disabled={privacyMode || !onUpdateServicePrincipal}
        />
        <button
          type="button"
          onClick={() =>
            onCopy(
              SERVICE_PRINCIPAL_CREATE_COMMAND,
              t('accounts.copyServicePrincipalCode')
            )
          }
          className="whitespace-nowrap rounded-lg border border-cyan-500 bg-cyan-50 px-2 py-1.5 text-xs text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-200 dark:hover:bg-cyan-900/30"
        >
          {t('accounts.copyServicePrincipalCode')}
        </button>
        <button
          type="button"
          disabled={
            privacyMode ||
            !onUpdateServicePrincipal ||
            !servicePrincipalJson.trim()
          }
          onClick={handleImportServicePrincipal}
          className={clsx(
            'px-2 py-1.5 rounded-lg border text-xs whitespace-nowrap',
            privacyMode ||
              !onUpdateServicePrincipal ||
              !servicePrincipalJson.trim()
              ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'
              : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/30'
          )}
        >
          {t('accounts.importServicePrincipal')}
        </button>
        {account.servicePrincipal && !privacyMode && (
          <button
            type="button"
            onClick={() => onUpdateServicePrincipal?.(undefined)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t('common.clear')}
          </button>
        )}
      </div>
      {account.servicePrincipal && (
        <div className="mt-1 text-[11px] text-muted-foreground truncate">
          {privacyMode
            ? t('accounts.servicePrincipalConfigured')
            : [
                account.servicePrincipal.displayName,
                account.servicePrincipal.appId,
                account.servicePrincipal.tenant,
              ]
                .filter(Boolean)
                .join(' / ')}
        </div>
      )}
    </div>
  );
}
