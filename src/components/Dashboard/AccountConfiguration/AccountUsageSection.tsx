import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type { CurrencyType, LocalAccount } from '../../../schemas/account';

export interface AccountUsageSectionProps {
  account: LocalAccount;
  privacyMode: boolean;
  onUpdatePurchase?: (amount: number, currency: CurrencyType) => void;
  onUpdateUsedAmount?: (usedAmount: number) => void;
}

export function AccountUsageSection({
  account,
  privacyMode,
  onUpdatePurchase,
  onUpdateUsedAmount,
}: AccountUsageSectionProps) {
  const { t } = useTranslation();
  if (privacyMode) return null;

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
      {/* Purchase amount */}
      <div className="lg:col-span-3">
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
              'border border-border bg-background text-foreground text-sm',
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
              'border border-border bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
          />
        </div>
      </div>

      {/* Used quota */}
      <div className="lg:col-span-2">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('accounts.usedAmount')}
        </label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">$</span>
          <input
            type="number"
            value={account.usedAmount ?? ''}
            onChange={(e) => onUpdateUsedAmount?.(Number(e.target.value))}
            placeholder="0"
            className={clsx(
              'flex-1 p-1.5 rounded-lg',
              'border border-border bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
          />
        </div>
      </div>

      {/* Account cost */}
      <div className="lg:col-span-2">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('accounts.accountCost')}
        </label>
        <div className="rounded-lg border border-border bg-muted/60 p-1.5 text-sm text-muted-foreground">
          {(() => {
            const quota =
              account.quota === 'custom'
                ? account.customQuota || 0
                : Number(account.quota || 200);
            if (quota === 0 || !account.purchaseAmount) return '-';
            const cost = account.purchaseAmount / quota;
            const symbol = account.purchaseCurrency === 'CNY' ? '¥' : '$';
            return `${symbol}${cost.toFixed(2)}`;
          })()}
        </div>
      </div>

      {/* Actual cost */}
      <div className="lg:col-span-2">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('accounts.actualCost')}
        </label>
        <div className="rounded-lg border border-border bg-muted/60 p-1.5 text-sm text-muted-foreground">
          {(() => {
            const used = account.usedAmount || 0;
            if (used === 0 || !account.purchaseAmount) return '-';
            const cost = account.purchaseAmount / used;
            const symbol = account.purchaseCurrency === 'CNY' ? '¥' : '$';
            return `${symbol}${cost.toFixed(2)}`;
          })()}
        </div>
      </div>

      {/* Usage rate */}
      <div className="lg:col-span-3">
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
  );
}
