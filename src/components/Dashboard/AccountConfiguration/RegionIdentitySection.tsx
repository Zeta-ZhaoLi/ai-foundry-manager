import { useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type {
  LocalRegion,
  RegionDeploymentConfig,
} from '../../../schemas/account';

const PRESET_REGIONS = [
  { value: 'eastus2', label: 'East US 2' },
  { value: 'eastus', label: 'East US' },
  { value: 'swedencentral', label: 'Sweden Central' },
  { value: 'westcentralus', label: 'West Central US' },
  { value: 'westeurope', label: 'West Europe' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'australiaeast', label: 'Australia East' },
  { value: 'brazilsouth', label: 'Brazil South' },
  { value: 'canadacentral', label: 'Canada Central' },
  { value: 'canadaeast', label: 'Canada East' },
  { value: 'centralindia', label: 'Central India' },
  { value: 'centralus', label: 'Central US' },
  { value: 'eastasia', label: 'East Asia' },
  { value: 'francecentral', label: 'France Central' },
  { value: 'germanywestcentral', label: 'Germany West Central' },
  { value: 'italynorth', label: 'Italy North' },
  { value: 'japaneast', label: 'Japan East' },
  { value: 'koreacentral', label: 'Korea Central' },
  { value: 'northcentralus', label: 'North Central US' },
  { value: 'northeurope', label: 'North Europe' },
  { value: 'norwayeast', label: 'Norway East' },
  { value: 'polandcentral', label: 'Poland Central' },
  { value: 'qatarcentral', label: 'Qatar Central' },
  { value: 'southafricanorth', label: 'South Africa North' },
  { value: 'southcentralus', label: 'South Central US' },
  { value: 'southindia', label: 'South India' },
  { value: 'southeastasia', label: 'Southeast Asia' },
  { value: 'spaincentral', label: 'Spain Central' },
  { value: 'switzerlandnorth', label: 'Switzerland North' },
  { value: 'switzerlandwest', label: 'Switzerland West' },
  { value: 'uaenorth', label: 'UAE North' },
  { value: 'uksouth', label: 'UK South' },
  { value: 'ukwest', label: 'UK West' },
] as const;

export interface RegionIdentitySectionProps {
  region: LocalRegion;
  regionIndex: number;
  privacyMode: boolean;
  displayRegionName: string;
  deploymentResourceName: string;
  canAutoGenerate: boolean;
  onUpdateEnabled: (enabled: boolean) => void;
  onUpdateName: (name: string) => void;
  onUpdateApiKey: (apiKey: string) => void;
  onUpdateDeployment?: (patch: Partial<RegionDeploymentConfig>) => void;
  onAutoGenerate: () => void;
  onCopy: (text: string, label: string) => void;
}

export function RegionIdentitySection({
  region,
  regionIndex,
  privacyMode,
  displayRegionName,
  deploymentResourceName,
  canAutoGenerate,
  onUpdateEnabled,
  onUpdateName,
  onUpdateApiKey,
  onUpdateDeployment,
  onAutoGenerate,
  onCopy,
}: RegionIdentitySectionProps) {
  const { t } = useTranslation();
  const [showApiKey, setShowApiKey] = useState(false);
  const isCustomRegion = !PRESET_REGIONS.some(
    (preset) => preset.value === region.name
  );
  const [showCustomInput, setShowCustomInput] = useState(isCustomRegion);

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2 pr-0 md:pr-20">
      {/* 鍚敤寮€鍏?+ 缂栧彿 + 鍖哄煙鍚嶇О */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="pt-6 shrink-0">
          <label
            className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title={t('regions.enableRegion')}
          >
            <input
              type="checkbox"
              checked={region.enabled !== false}
              onChange={(e) => onUpdateEnabled(e.target.checked)}
              className="cursor-pointer"
            />
          </label>
        </div>

        {/* 鍖哄煙缂栧彿 + 鍖哄煙鍚嶇О */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-medium">
              {regionIndex + 1}.
            </span>
            <label className="text-xs text-muted-foreground">
              {t('regions.regionName')}
            </label>
          </div>
          {privacyMode ? (
            <input
              className={clsx(
                'w-full p-1.5 rounded-lg',
                'border border-border bg-background text-foreground text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
              )}
              value={displayRegionName}
              disabled
            />
          ) : showCustomInput ? (
            <div className="flex items-center gap-1">
              <input
                className={clsx(
                  'flex-1 p-1.5 rounded-lg',
                  'border border-border bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={region.name}
                onChange={(e) => onUpdateName(e.target.value)}
                placeholder={t('regions.regionNamePlaceholder')}
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  onUpdateName('eastus2');
                }}
                className="px-2 py-1.5 rounded-lg border border-gray-700 bg-background text-xs text-muted-foreground hover:bg-slate-800"
                title={t('regions.usePreset')}
              >
                鈫?{' '}
              </button>
            </div>
          ) : (
            <select
              className={clsx(
                'w-full p-1.5 rounded-lg',
                'border border-gray-700 bg-background text-foreground text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                'cursor-pointer'
              )}
              value={region.name}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setShowCustomInput(true);
                  onUpdateName('');
                } else {
                  onUpdateName(e.target.value);
                }
              }}
            >
              {PRESET_REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
              <option value="__custom__">{t('regions.customRegion')}</option>
            </select>
          )}
        </div>
      </div>

      {/* API Key 甯︽樉绀?闅愯棌/澶嶅埗鎸夐挳 */}
      <div className="flex-1 min-w-0 pl-7 md:pl-0">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('regions.apiKey')}
        </label>
        <div className="flex items-center gap-1">
          <input
            type={privacyMode ? 'password' : showApiKey ? 'text' : 'password'}
            className={clsx(
              'flex-1 min-w-0 p-1.5 rounded-lg',
              'border border-gray-700 bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={privacyMode ? '***' : region.apiKey || ''}
            onChange={(e) => onUpdateApiKey(e.target.value)}
            placeholder={t('regions.apiKeyPlaceholder')}
            disabled={privacyMode}
          />
          {/* 鏄剧ず/闅愯棌鎸夐挳 */}
          {!privacyMode && (
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
              title={showApiKey ? t('common.hide') : t('common.show')}
            >
              {showApiKey ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
          {/* 澶嶅埗鎸夐挳 */}
          {!privacyMode && region.apiKey && (
            <button
              type="button"
              onClick={() =>
                onCopy(region.apiKey || '', `${region.name} API Key`)
              }
              className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
              title={t('common.copy')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 pl-7 md:pl-0">
        <label className="text-xs text-muted-foreground block mb-1">
          {t('accounts.resourceName')}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            className={clsx(
              'flex-1 min-w-0 p-1.5 rounded-lg',
              'border border-gray-700 bg-background text-foreground text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            )}
            value={privacyMode ? '***' : deploymentResourceName}
            onChange={(e) =>
              onUpdateDeployment?.({ resourceName: e.target.value })
            }
            placeholder="my-aoai"
            disabled={privacyMode || !onUpdateDeployment}
          />
          {!privacyMode && canAutoGenerate && (
            <button
              type="button"
              onClick={onAutoGenerate}
              className="px-2.5 py-1.5 rounded-lg border border-gray-700 bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
              title={t('regions.autoGenerate')}
            >
              {t('regions.autoGenerate')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
