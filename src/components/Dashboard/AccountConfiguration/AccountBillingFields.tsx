import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type { AccountQuota, LocalAccount } from '../../../schemas/account';

const QUOTA_OPTIONS: { value: AccountQuota; label: string }[] = [
  { value: '200', label: '$200' },
  { value: '1000', label: '$1,000' },
  { value: '2000', label: '$2,000' },
  { value: '5000', label: '$5,000' },
  { value: '20000', label: '$20,000' },
  { value: '25000', label: '$25,000' },
  { value: '45000', label: '$45,000' },
  { value: 'custom', label: '' },
];

export interface AccountBillingFieldsProps {
  account: LocalAccount;
  privacyMode: boolean;
  onUpdateNote: (note: string) => void;
  onUpdateQuota?: (quota: AccountQuota, customQuota?: number) => void;
}

export function AccountBillingFields({
  account,
  privacyMode,
  onUpdateNote,
  onUpdateQuota,
}: AccountBillingFieldsProps) {
  const { t } = useTranslation();
  const displayNote = privacyMode ? '***' : account.note;

  return (
    <>
      <div className="md:col-span-2">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('accounts.quota')}
        </label>
        <div className="flex items-center gap-1">
          <select
            value={account.quota || '200'}
            onChange={(e) => onUpdateQuota?.(e.target.value as AccountQuota)}
            className={clsx(
              'flex-1 px-2 py-1.5 rounded-lg',
              'border border-border bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'cursor-pointer'
            )}
          >
            {QUOTA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value === 'custom' ? t('accounts.quotaCustom') : opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom quota */}
      {account.quota === 'custom' && (
        <div className="md:col-span-1">
          <label className="text-xs text-muted-foreground block mb-1">$</label>
          <input
            type="number"
            value={account.customQuota || ''}
            onChange={(e) => onUpdateQuota?.('custom', Number(e.target.value))}
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
    </>
  );
}
