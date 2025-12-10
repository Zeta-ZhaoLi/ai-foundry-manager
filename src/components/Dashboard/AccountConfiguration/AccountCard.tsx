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
import { LocalRegion } from './RegionCard';
import { SortableRegionCard } from './SortableRegionCard';
import { AccountTier, AccountQuota, CurrencyType } from '../../../hooks/useLocalAzureAccounts';

export interface LocalAccount {
  id: string;
  name: string;
  note?: string;
  enabled: boolean;
  regions: LocalRegion[];
  tier?: AccountTier;
  quota?: AccountQuota;
  customQuota?: number;
  purchaseAmount?: number;
  purchaseCurrency?: CurrencyType;
  usedAmount?: number;
}

export interface AccountCardProps {
  account: LocalAccount;
  index?: number;
  privacyMode?: boolean;
  masterModels: string[];
  filteredModels: string[];
  onUpdateName: (name: string) => void;
  onUpdateNote: (note: string) => void;
  onUpdateEnabled: (enabled: boolean) => void;
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
  onUpdateRegionAnthropicEndpoint: (regionId: string, endpoint: string) => void;
  onUpdateRegionApiKey: (regionId: string, apiKey: string) => void;
  onUpdateRegionEnabled: (regionId: string, enabled: boolean) => void;
  onReorderRegions?: (oldIndex: number, newIndex: number) => void;
  onCopy: (text: string, label: string) => void;
}

// 额度选项配置
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
  masterModels,
  filteredModels,
  onUpdateName,
  onUpdateNote,
  onUpdateEnabled,
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
  onUpdateRegionAnthropicEndpoint,
  onUpdateRegionApiKey,
  onUpdateRegionEnabled,
  onReorderRegions,
  onCopy,
}) => {
  const { t } = useTranslation();
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

  // 隐私模式下显示的名称
  const displayName = privacyMode
    ? t('accounts.account') + ` ${index + 1}`
    : account.name || t('accounts.account') + ` ${index + 1}`;

  const displayNote = privacyMode ? '***' : account.note;

  // 未启用账号收起时的简化视图
  if (!account.enabled && !isExpanded) {
    return (
      <div
        className={clsx(
          'rounded-xl border border-gray-800 p-3',
          'bg-gradient-to-br from-slate-950/90 to-slate-950/70',
          'shadow-lg opacity-50'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">{index + 1}.</span>
            {account.tier === 'premium' && <span title={t('accounts.tierPremium')}>⭐</span>}
            <span className="text-sm font-medium">{displayName}</span>
            {account.quota && (
              <span className="text-xs text-muted-foreground">
                ({account.quota === 'custom' ? `$${account.customQuota?.toLocaleString() || 0}` : QUOTA_OPTIONS.find(o => o.value === account.quota)?.label})
              </span>
            )}
            <span className="text-xs text-gray-500">({t('regions.disabled')})</span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-2 py-0.5 rounded-full border border-gray-600 bg-background text-foreground text-xs cursor-pointer hover:bg-slate-800"
          >
            {t('accounts.expand')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={clsx(
          'rounded-xl border border-gray-800 p-3',
          'bg-gradient-to-br from-slate-950/90 to-slate-950/70',
          'shadow-lg',
          account.enabled ? 'opacity-100' : 'opacity-60'
        )}
      >
        {/* Account header - 使用 Grid 统一对齐 */}
        <div className="mb-2">
          {/* 第一行：编号 + 操作按钮 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">{index + 1}.</span>
              {account.tier === 'premium' && <span title={t('accounts.tierPremium')}>⭐</span>}
              <span className="text-sm font-medium">{displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={account.enabled}
                  onChange={(e) => onUpdateEnabled(e.target.checked)}
                  className="cursor-pointer"
                />
                <span>{t('accounts.enableAccount')}</span>
              </label>
              {!account.enabled && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-2 py-0.5 rounded-full border border-gray-600 bg-background text-foreground text-xs cursor-pointer hover:bg-slate-800"
                >
                  {t('accounts.collapse')}
                </button>
              )}
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
            </div>
          </div>

          {/* 第二行：类别 + 账号名称 + 额度 + 备注 - 统一 Grid 对齐 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* 类别选择 - 2列 */}
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">
                {t('accounts.tier')}
              </label>
              <select
                value={account.tier || 'standard'}
                onChange={(e) => onUpdateTier?.(e.target.value as AccountTier)}
                className={clsx(
                  'w-full px-2 py-1.5 rounded-lg',
                  'border border-gray-700 bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'cursor-pointer'
                )}
              >
                <option value="premium">⭐ {t('accounts.tierPremium')}</option>
                <option value="standard">{t('accounts.tierStandard')}</option>
              </select>
            </div>

            {/* 账号名称 - 4列 */}
            <div className="md:col-span-4">
              <label className="text-xs text-muted-foreground block mb-1">
                {t('accounts.accountName')}
              </label>
              <input
                className={clsx(
                  'w-full p-1.5 rounded-lg',
                  'border border-gray-700 bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={privacyMode ? displayName : account.name}
                onChange={(e) => onUpdateName(e.target.value)}
                placeholder={t('accounts.accountNamePlaceholder')}
                disabled={privacyMode}
              />
            </div>

            {/* 额度选择 - 2列 */}
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
                    'border border-gray-700 bg-background text-foreground text-sm',
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

            {/* 自定义额度输入 - 仅在选择自定义时显示 */}
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
                    'border border-gray-700 bg-background text-foreground text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  )}
                />
              </div>
            )}

            {/* 备注 - 剩余列 */}
            <div className={account.quota === 'custom' ? 'md:col-span-3' : 'md:col-span-4'}>
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

          {/* 第三行：购买金额 + 已使用额度 (隐私模式下隐藏) */}
          {!privacyMode && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3">
              {/* 购买金额 - 3列 */}
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.purchaseAmount')}
                </label>
                <div className="flex items-center gap-1">
                  <select
                    value={account.purchaseCurrency || 'USD'}
                    onChange={(e) => onUpdatePurchase?.(account.purchaseAmount || 0, e.target.value as CurrencyType)}
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
                    onChange={(e) => onUpdatePurchase?.(Number(e.target.value), account.purchaseCurrency || 'USD')}
                    placeholder="0"
                    className={clsx(
                      'flex-1 p-1.5 rounded-lg',
                      'border border-gray-700 bg-background text-foreground text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                    )}
                  />
                </div>
              </div>

              {/* 已使用额度 - 2列 */}
              <div className="md:col-span-2">
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
                      'border border-gray-700 bg-background text-foreground text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                    )}
                  />
                </div>
              </div>

              {/* 账号成本/$ - 只读显示 - 2列 */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.accountCost')}
                </label>
                <div className="p-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-sm text-muted-foreground">
                  {(() => {
                    const quota = account.quota === 'custom'
                      ? (account.customQuota || 0)
                      : Number(account.quota || 200);
                    if (quota === 0 || !account.purchaseAmount) return '-';
                    const cost = account.purchaseAmount / quota;
                    const symbol = account.purchaseCurrency === 'CNY' ? '¥' : '$';
                    return `${symbol}${cost.toFixed(2)}`;
                  })()}
                </div>
              </div>

              {/* 实际成本/$ - 只读显示 - 2列 */}
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.actualCost')}
                </label>
                <div className="p-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-sm text-muted-foreground">
                  {(() => {
                    const used = account.usedAmount || 0;
                    if (used === 0 || !account.purchaseAmount) return '-';
                    const cost = account.purchaseAmount / used;
                    const symbol = account.purchaseCurrency === 'CNY' ? '¥' : '$';
                    return `${symbol}${cost.toFixed(2)}`;
                  })()}
                </div>
              </div>

              {/* 额度使用率进度条 - 3列 */}
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground block mb-1">
                  {t('accounts.usageRate')}
                </label>
                {(() => {
                  const quota = account.quota === 'custom'
                    ? (account.customQuota || 0)
                    : Number(account.quota || 200);
                  const used = account.usedAmount || 0;
                  if (quota === 0) return <div className="text-xs text-gray-500">-</div>;
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
        </div>

        {/* Regions */}
        <div className="mb-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-medium">{t('regions.regionList')}</div>
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
                      masterModels={masterModels}
                      filteredModels={filteredModels}
                      onUpdateName={(name) => onUpdateRegionName(region.id, name)}
                      onUpdateModelsText={(text) => onUpdateRegionModelsText(region.id, text)}
                      onUpdateOpenaiEndpoint={(endpoint) => onUpdateRegionOpenaiEndpoint(region.id, endpoint)}
                      onUpdateAnthropicEndpoint={(endpoint) => onUpdateRegionAnthropicEndpoint(region.id, endpoint)}
                      onUpdateApiKey={(apiKey) => onUpdateRegionApiKey(region.id, apiKey)}
                      onUpdateEnabled={(enabled) => onUpdateRegionEnabled(region.id, enabled)}
                      onDelete={() => onDeleteRegion(region.id)}
                      onCopy={onCopy}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
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
