import React from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { buildCopyString } from '../../../utils/modelSeries';

export interface AccountSummaryItem {
  accountKey: string;
  regions: {
    [regionLabel: string]: {
      models: string[];
    };
  };
  allModels: string[];
}

export interface AccountSummaryProps {
  accountSummaries: AccountSummaryItem[];
  onCopy: (text: string, label: string) => void;
}

export const AccountSummary: React.FC<AccountSummaryProps> = ({
  accountSummaries,
  onCopy,
}) => {
  const { t } = useTranslation();

  if (accountSummaries.length === 0) return null;

  return (
    <section className="p-4 rounded-xl border border-gray-800 bg-background">
      <h2 className="text-lg font-semibold mb-2">{t('summary.byAccount')}</h2>
      <div className="flex flex-col gap-3">
        {accountSummaries.map((acc) => {
          const copyStr = buildCopyString(acc.allModels);
          return (
            <div
              key={acc.accountKey}
              className="rounded-lg border border-gray-800 p-2.5 bg-background"
            >
              <div className="flex justify-between items-center mb-1">
                <div>
                  <div className="text-base font-semibold">
                    {t('summary.account')}: {acc.accountKey}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('summary.regionCount', { count: Object.keys(acc.regions).length })}
                    {t('summary.modelCount', { count: acc.allModels.length })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onCopy(copyStr, `${t('summary.account')} ${acc.accountKey} ${t('summary.modelList')}`)
                  }
                  disabled={acc.allModels.length === 0}
                  className={clsx(
                    'px-2.5 py-1 rounded-full',
                    'border border-gray-600 bg-background text-foreground',
                    'text-sm cursor-pointer hover:bg-slate-800',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {t('summary.copyAccountModels')}
                </button>
              </div>
              <div
                className={clsx(
                  'text-xs text-foreground',
                  'whitespace-pre-wrap break-all',
                  'max-h-32 overflow-y-auto'
                )}
              >
                {copyStr}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

AccountSummary.displayName = 'AccountSummary';
