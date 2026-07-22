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
    <div className="md:col-span-3">
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
          className="px-2 py-1.5 rounded-lg border border-cyan-500 bg-cyan-900/20 text-cyan-200 text-xs whitespace-nowrap hover:bg-cyan-900/30"
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
              ? 'border-gray-700 bg-gray-900/40 text-gray-500 cursor-not-allowed'
              : 'border-blue-500 bg-blue-900/20 text-blue-200 hover:bg-blue-900/30'
          )}
        >
          {t('accounts.importServicePrincipal')}
        </button>
        {account.servicePrincipal && !privacyMode && (
          <button
            type="button"
            onClick={() => onUpdateServicePrincipal?.(undefined)}
            className="px-2 py-1.5 rounded-lg border border-gray-700 bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
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
