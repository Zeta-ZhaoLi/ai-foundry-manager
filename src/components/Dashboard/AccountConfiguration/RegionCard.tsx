import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { buildCopyString, groupModelsByCategory, ModelCategory } from '../../../utils/modelSeries';
import { useToast } from '../../../hooks/useToast';
import { convertOpenAIToAnthropicEndpoint, convertAnthropicToOpenAIEndpoint } from '../../../utils/common';

export interface LocalRegion {
  id: string;
  name: string;
  modelsText: string;
  openaiEndpoint?: string;
  anthropicEndpoint?: string;
  apiKey?: string;
  enabled?: boolean;  // 默认 true
  openaiEndpointManualOverride?: boolean;
  anthropicEndpointManualOverride?: boolean;
}

export interface RegionCardProps {
  region: LocalRegion;
  regionIndex?: number;
  privacyMode?: boolean;
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

// 隐私模式下打码 Endpoint
const maskEndpoint = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    if (parts.length >= 2) {
      parts[0] = '***';  // 打码第一段
    }
    return `${parsed.protocol}//${parts.join('.')}`;
  } catch {
    return '***';
  }
};

// 分类标签配置
const CATEGORY_CONFIG: Record<ModelCategory, { labelKey: string; color: string }> = {
  standard: { labelKey: 'modelCategory.standard', color: 'text-cyan-400' },
  sora: { labelKey: 'modelCategory.sora', color: 'text-purple-400' },
  claude: { labelKey: 'modelCategory.claude', color: 'text-orange-400' },
};

// 预设 Azure 区域列表 (value: API值, label: 显示名称)
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

export const RegionCard: React.FC<RegionCardProps> = ({
  region,
  regionIndex = 0,
  privacyMode = false,
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
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(region.enabled !== false);

  // 判断当前区域名是否为自定义（不在预设列表中）
  const isCustomRegion = !PRESET_REGIONS.some(r => r.value === region.name);
  const [showCustomInput, setShowCustomInput] = useState(isCustomRegion);

  // 获取当前区域的显示标签
  const getRegionLabel = (value: string) => {
    const found = PRESET_REGIONS.find(r => r.value === value);
    return found ? found.label : value;
  };

  // Handle OpenAI endpoint change with auto-sync
  const handleOpenAIEndpointChange = (newValue: string) => {
    onUpdateOpenaiEndpoint(newValue);

    // If not manually overridden for Anthropic, auto-generate it
    if (!region.anthropicEndpointManualOverride && newValue) {
      const generated = convertOpenAIToAnthropicEndpoint(newValue);
      if (generated) {
        onUpdateAnthropicEndpoint(generated);
      }
    }
  };

  // Handle Anthropic endpoint change with auto-sync
  const handleAnthropicEndpointChange = (newValue: string) => {
    onUpdateAnthropicEndpoint(newValue);

    // If not manually overridden for OpenAI, auto-generate it
    if (!region.openaiEndpointManualOverride && newValue) {
      const generated = convertAnthropicToOpenAIEndpoint(newValue);
      if (generated) {
        onUpdateOpenaiEndpoint(generated);
      }
    }
  };

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

  // 粘贴导入模型
  const handlePasteModels = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const models = text
        .split(/[\s,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (models.length === 0) {
        toast.error(t('regions.pasteEmpty'));
        return;
      }

      const currentModels = parseModels(region.modelsText);
      const mergedSet = new Set([...currentModels, ...models]);
      onUpdateModelsText(Array.from(mergedSet).sort().join(','));
      toast.success(t('regions.pasteSuccess', { count: models.length }));
    } catch {
      toast.error(t('regions.pasteFailed'));
    }
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

  // 隐私模式下显示的区域名称
  const displayRegionName = privacyMode
    ? t('regions.region') + ` ${regionIndex + 1}`
    : region.name || t('regions.region') + ` ${regionIndex + 1}`;

  // 未启用区域收起时的简化视图
  if (isDisabled && !isExpanded) {
    return (
      <div className="rounded-lg border border-gray-800 p-2.5 bg-background opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{regionIndex + 1}.</span>
            <span className="text-sm">{displayRegionName}</span>
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

        {/* 第一行: 启用开关 + 区域编号 + 区域名称 + API Key */}
        <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2 pr-0 md:pr-20">
          {/* 启用开关 + 编号 + 区域名称 */}
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

            {/* 区域编号 + 区域名称 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-medium">{regionIndex + 1}.</span>
                <label className="text-xs text-muted-foreground">
                  {t('regions.regionName')}
                </label>
              </div>
              {privacyMode ? (
                <input
                  className={clsx(
                    'w-full p-1.5 rounded-lg',
                    'border border-gray-700 bg-background text-foreground text-sm',
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
                      'border border-gray-700 bg-background text-foreground text-sm',
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
                    ↩
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
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                  <option value="__custom__">{t('regions.customRegion')}</option>
                </select>
              )}
            </div>
          </div>

          {/* API Key 带显示/隐藏/复制按钮 */}
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
        <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2 pl-7">
          {/* OpenAI Endpoint */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
              <span>{t('regions.openaiEndpoint')}</span>
              {region.openaiEndpoint && region.anthropicEndpoint && !region.openaiEndpointManualOverride && (
                <span
                  className="text-cyan-400"
                  title={t('regions.endpointAutoSynced', { type: 'Anthropic' })}
                >
                  🔄
                </span>
              )}
              {region.openaiEndpointManualOverride && (
                <span
                  className="text-yellow-400"
                  title={t('regions.endpointManualOverride')}
                >
                  ✏️
                </span>
              )}
            </label>
            <div className="flex items-center gap-1">
              <input
                className={clsx(
                  'flex-1 min-w-0 p-1.5 rounded-lg',
                  'border border-gray-700 bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={privacyMode ? maskEndpoint(region.openaiEndpoint || '') : (region.openaiEndpoint || '')}
                onChange={(e) => handleOpenAIEndpointChange(e.target.value)}
                placeholder="https://xxx.openai.azure.com"
                disabled={privacyMode}
              />
              {/* 复制按钮 */}
              {region.openaiEndpoint && (
                <button
                  type="button"
                  onClick={() => onCopy(region.openaiEndpoint || '', 'OpenAI Endpoint')}
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

          {/* Anthropic Endpoint */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
              <span>{t('regions.anthropicEndpoint')}</span>
              {region.anthropicEndpoint && region.openaiEndpoint && !region.anthropicEndpointManualOverride && (
                <span
                  className="text-cyan-400"
                  title={t('regions.endpointAutoSynced', { type: 'OpenAI' })}
                >
                  🔄
                </span>
              )}
              {region.anthropicEndpointManualOverride && (
                <span
                  className="text-yellow-400"
                  title={t('regions.endpointManualOverride')}
                >
                  ✏️
                </span>
              )}
            </label>
            <div className="flex items-center gap-1">
              <input
                className={clsx(
                  'flex-1 min-w-0 p-1.5 rounded-lg',
                  'border border-gray-700 bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                )}
                value={privacyMode ? maskEndpoint(region.anthropicEndpoint || '') : (region.anthropicEndpoint || '')}
                onChange={(e) => handleAnthropicEndpointChange(e.target.value)}
                placeholder="https://xxx.services.ai.azure.com"
                disabled={privacyMode}
              />
              {/* 复制按钮 */}
              {region.anthropicEndpoint && (
                <button
                  type="button"
                  onClick={() => onCopy(region.anthropicEndpoint || '', 'Anthropic Endpoint')}
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

          {/* 收起按钮 (未启用时显示) */}
          {isDisabled && (
            <div className="flex items-end pb-1">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-2 py-0.5 rounded-full border border-gray-600 bg-background text-foreground text-xs cursor-pointer hover:bg-slate-800"
              >
                {t('accounts.collapse')}
              </button>
            </div>
          )}
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
              {/* 粘贴导入按钮 */}
              <button
                type="button"
                onClick={handlePasteModels}
                className="px-2 py-0.5 rounded-full border border-blue-900 bg-blue-900/30 text-blue-300 text-xs cursor-pointer hover:bg-blue-900/50"
              >
                {t('regions.pasteModels')}
              </button>
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
                    const selectedModels = models.filter((m) => selectedSet.has(m));

                    return (
                      <div key={category} className="border border-gray-800 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={clsx('text-xs font-medium', config.color)}>
                            {t(config.labelKey)}
                            <span className="text-muted-foreground ml-1">
                              ({selectedCount}/{models.length})
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            {/* 复制此分类已选模型 */}
                            {selectedModels.length > 0 && (
                              <button
                                type="button"
                                onClick={() => onCopy(
                                  buildCopyString(selectedModels),
                                  `${displayRegionName} - ${t(config.labelKey)}`
                                )}
                                className="px-1.5 py-0.5 rounded border border-gray-700 bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-slate-800 hover:text-foreground"
                                title={t('regions.copyCategoryModels')}
                              >
                                📋
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => selectCategory(category)}
                              className="px-1.5 py-0.5 rounded border border-gray-700 bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-slate-800 hover:text-foreground"
                            >
                              {t('regions.selectCategory')}
                            </button>
                          </div>
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
                    `${t('accounts.account')} ${accountName} / ${t('regions.region')} ${displayRegionName}`
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
