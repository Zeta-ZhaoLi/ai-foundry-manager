import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { buildCopyString, groupModelsByCategory, ModelCategory } from '../../../utils/modelSeries';

export interface LocalRegion {
  id: string;
  name: string;
  modelsText: string;
  openaiEndpoint?: string;
  anthropicEndpoint?: string;
  apiKey?: string;
  enabled?: boolean;  // 默认 true
}

export interface RegionCardProps {
  region: LocalRegion;
  accountId: string;
  accountName: string;
  masterModels: string[];
  filteredModels: string[];
  onUpdateName: (name: string) => void;
  onUpdateModelsText: (text: string) => void;
  onUpdateOpenaiEndpoint: (endpoint: string) => void;
  onUpdateAnthropicEndpoint: (endpoint: string) => void;
  onUpdateApiKey: (apiKey: string) => void;
  onUpdateEnabled: (enabled: boolean) => void;
  onDelete: () => void;
  onCopy: (text: string, label: string) => void;
}

const parseModels = (text: string): string[] => {
  if (!text) return [];
  const parts = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

// 分类标签配置
const CATEGORY_CONFIG: Record<ModelCategory, { labelKey: string; color: string }> = {
  standard: { labelKey: 'modelCategory.standard', color: 'text-cyan-400' },
  sora: { labelKey: 'modelCategory.sora', color: 'text-purple-400' },
  claude: { labelKey: 'modelCategory.claude', color: 'text-orange-400' },
};

export const RegionCard: React.FC<RegionCardProps> = ({
  region,
  accountName,
  masterModels,
  filteredModels,
  onUpdateName,
  onUpdateModelsText,
  onUpdateOpenaiEndpoint,
  onUpdateAnthropicEndpoint,
  onUpdateApiKey,
  onUpdateEnabled,
  onDelete,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const selectedSet = new Set(parseModels(region.modelsText));
  const regionModels = Array.from(selectedSet).sort();

  // 按分类分组 master 模型和已选模型
  const groupedFilteredModels = useMemo(
    () => groupModelsByCategory(filteredModels),
    [filteredModels]
  );

  const toggleModel = (modelId: string) => {
    const set = new Set(parseModels(region.modelsText));
    if (set.has(modelId)) {
      set.delete(modelId);
    } else {
      set.add(modelId);
    }
    onUpdateModelsText(Array.from(set).sort().join(','));
  };

  const selectAll = () => {
    if (masterModels.length === 0) return;
    onUpdateModelsText(masterModels.join(','));
  };

  const selectCategory = (category: ModelCategory) => {
    const categoryModels = groupedFilteredModels[category];
    if (categoryModels.length === 0) return;
    const set = new Set(parseModels(region.modelsText));
    for (const model of categoryModels) {
      set.add(model);
    }
    onUpdateModelsText(Array.from(set).sort().join(','));
  };

  const clearModels = () => {
    onUpdateModelsText('');
  };

  // 计算各分类已选数量
  const selectedByCategory = useMemo(() => {
    const result: Record<ModelCategory, number> = { standard: 0, sora: 0, claude: 0 };
    for (const model of regionModels) {
      const grouped = groupModelsByCategory([model]);
      if (grouped.standard.length > 0) result.standard++;
      if (grouped.sora.length > 0) result.sora++;
      if (grouped.claude.length > 0) result.claude++;
    }
    return result;
  }, [regionModels]);

  const isDisabled = region.enabled === false;

  return (
    <>
      <div className={clsx(
        'rounded-lg border border-gray-800 p-2.5 bg-background relative',
        isDisabled && 'opacity-50'
      )}>
        {/* 删除按钮 - 绝对定位在右上角 */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="absolute top-2 right-2 px-2 py-1 rounded-lg border border-red-900 bg-transparent text-red-300 text-xs cursor-pointer hover:bg-red-900/30"
        >
          {t('regions.deleteRegion')}
        </button>

        {/* 第一行: 启用开关 + 区域名称 + API Key (含显示/复制按钮) */}
        {/* 移动端：单列布局 | 桌面端：双列布局 */}
        <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2 pr-0 md:pr-20">
          {/* 启用开关 + 区域名称 */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="pt-6 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap" title={t('regions.enableRegion')}>
                <input
                  type="checkbox"
                  checked={region.enabled !== false}
                  onChange={(e) => onUpdateEnabled(e.target.checked)}
                  className="cursor-pointer"
                />
              </label>
            </div>

            {/* 区域名称 */}
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted-foreground block mb-1">
                {t('regions.regionName')}
              </label>
              <input
                className={clsx(
                  'w-full p-1.5 rounded-lg',
                  'border border-gray-700 bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={region.name}
                onChange={(e) => onUpdateName(e.target.value)}
                placeholder={t('regions.regionNamePlaceholder')}
              />
            </div>
          </div>

          {/* API Key 带显示/隐藏/复制按钮 - 移动端全宽 */}
          <div className="flex-1 min-w-0 pl-7 md:pl-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.apiKey')}
            </label>
            <div className="flex items-center gap-1">
              <input
                type={showApiKey ? 'text' : 'password'}
                className={clsx(
                  'flex-1 min-w-0 p-1.5 rounded-lg',
                  'border border-gray-700 bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={region.apiKey || ''}
                onChange={(e) => onUpdateApiKey(e.target.value)}
                placeholder={t('regions.apiKeyPlaceholder')}
              />
              {/* 显示/隐藏按钮 */}
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
                title={showApiKey ? t('common.hide') : t('common.show')}
              >
                {showApiKey ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
              {/* 复制按钮 */}
              {region.apiKey && (
                <button
                  type="button"
                  onClick={() => onCopy(region.apiKey || '', `${region.name} API Key`)}
                  className="p-1.5 rounded-lg border border-gray-700 bg-background text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
                  title={t('common.copy')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 第二行: OpenAI Endpoint + Anthropic Endpoint */}
        {/* 移动端：单列布局 | 桌面端：双列布局 */}
        <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2 pl-7">
          {/* OpenAI Endpoint */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.openaiEndpoint')}
            </label>
            <input
              className={clsx(
                'w-full p-1.5 rounded-lg',
                'border border-gray-700 bg-background text-foreground text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
              )}
              value={region.openaiEndpoint || ''}
              onChange={(e) => onUpdateOpenaiEndpoint(e.target.value)}
              placeholder="https://xxx.openai.azure.com"
            />
          </div>

          {/* Anthropic Endpoint */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.anthropicEndpoint')}
            </label>
            <input
              className={clsx(
                'w-full p-1.5 rounded-lg',
                'border border-gray-700 bg-background text-foreground text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
              )}
              value={region.anthropicEndpoint || ''}
              onChange={(e) => onUpdateAnthropicEndpoint(e.target.value)}
              placeholder="https://xxx.services.ai.azure.com"
            />
          </div>
        </div>

        {/* 模型选择区域 */}
        <div className="border-t border-gray-800 pt-2">
          {/* 模型区域头部 */}
          <div className="flex items-center justify-between mb-1.5">
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="flex items-center gap-1.5 bg-transparent text-foreground text-xs cursor-pointer border-none p-0"
            >
              <span className="inline-block w-3.5 text-center text-muted-foreground">
                {collapsed ? '▶' : '▼'}
              </span>
              <span>{t('regions.modelsToggle')}</span>
              {regionModels.length > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({regionModels.length})
                </span>
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="px-2 py-0.5 rounded-full border border-green-900 bg-green-900/30 text-green-300 text-xs cursor-pointer hover:bg-green-900/50"
              >
                {t('regions.selectAll')}
              </button>
              <button
                type="button"
                onClick={clearModels}
                className="px-2 py-0.5 rounded-full border border-red-900 bg-red-900/30 text-red-300 text-xs cursor-pointer hover:bg-red-900/50"
              >
                {t('regions.clear')}
              </button>
            </div>
          </div>

          {/* 模型选择器 - 按分类显示 */}
          {!collapsed && (
            <>
              {masterModels.length === 0 ? (
                <div className="text-xs text-gray-500 mt-1">
                  {t('regions.configureMasterFirst')}
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="text-xs text-gray-500 mt-1">
                  {t('regions.noMatchingModels')}
                </div>
              ) : (
                <div className="space-y-2 mt-1.5">
                  {/* 按分类渲染 */}
                  {(['standard', 'sora', 'claude'] as ModelCategory[]).map((category) => {
                    const models = groupedFilteredModels[category];
                    if (models.length === 0) return null;
                    const config = CATEGORY_CONFIG[category];
                    const selectedCount = selectedByCategory[category];

                    return (
                      <div key={category} className="border border-gray-800 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={clsx('text-xs font-medium', config.color)}>
                            {t(config.labelKey)}
                            <span className="text-muted-foreground ml-1">
                              ({selectedCount}/{models.length})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => selectCategory(category)}
                            className="px-1.5 py-0.5 rounded border border-gray-700 bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-slate-800 hover:text-foreground"
                          >
                            {t('regions.selectCategory')}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {models.map((model) => {
                            const selected = selectedSet.has(model);
                            return (
                              <button
                                key={model}
                                type="button"
                                onClick={() => toggleModel(model)}
                                className={clsx(
                                  'px-2 py-1 rounded-full text-xs cursor-pointer transition-all',
                                  selected
                                    ? 'border border-cyan-500 bg-gradient-to-r from-cyan-500 to-green-500 text-white'
                                    : 'border border-gray-600 bg-background text-foreground hover:border-gray-500'
                                )}
                              >
                                {model}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* 复制区域模型 */}
          {regionModels.length > 0 && (
            <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-gray-800 pt-2">
              <span>{t('regions.selectedCount', { count: regionModels.length })}</span>
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    buildCopyString(regionModels),
                    `${t('accounts.account')} ${accountName} / ${t('regions.region')} ${region.name || t('regions.unnamed')}`
                  )
                }
                className="px-2 py-0.5 rounded-full border border-gray-600 bg-background text-foreground cursor-pointer hover:bg-slate-800"
              >
                {t('regions.copyRegionModels')}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('confirmDialog.deleteRegion.title')}
        description={t('confirmDialog.deleteRegion.description')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
        onConfirm={onDelete}
      />
    </>
  );
};

RegionCard.displayName = 'RegionCard';
