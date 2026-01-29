import React, { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { buildCopyString } from '../../../utils/modelSeries';
import { useToast } from '../../../hooks/useToast';
import {
  convertOpenAIToAnthropicEndpoint,
  convertAnthropicToOpenAIEndpoint,
  extractAzureResourceName,
  orderModelsByMaster,
} from '../../../utils/common';
import type {
  LocalRegion as ImportedLocalRegion,
  AccountDeploymentConfig,
  RegionDeploymentConfig,
  RegionDeploymentModelConfig,
} from '../../../hooks/useLocalAzureAccounts';

import { stringifyAzureOpenAiArmTemplate } from '../../../utils/armTemplate';
import { buildAzurePortalResourceGroupOverviewUrl } from '../../../utils/azurePortal';

export type LocalRegion = ImportedLocalRegion;

export interface RegionCardProps {
  region: LocalRegion;
  regionIndex?: number;
  privacyMode?: boolean;
  accountId: string;
  accountName: string;
  masterModels: string[];
  masterGroups: string[][];
  filteredModels: string[];
  onUpdateName: (name: string) => void;
  onUpdateModelsText: (text: string) => void;
  onUpdateOpenaiEndpoint: (endpoint: string) => void;
  onUpdateAnthropicEndpoint: (endpoint: string) => void;
  onUpdateApiKey: (apiKey: string) => void;
  accountDeployment?: AccountDeploymentConfig;
  onUpdateDeployment?: (patch: Partial<RegionDeploymentConfig>) => void;
  onUpdateDeploymentModel?: (
    modelName: string,
    patch: Partial<RegionDeploymentModelConfig>
  ) => void;
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
      parts[0] = '***'; // 打码第一段
    }
    return `${parsed.protocol}//${parts.join('.')}`;
  } catch {
    return '***';
  }
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
  masterGroups,
  filteredModels,
  onUpdateName,
  onUpdateModelsText,
  onUpdateOpenaiEndpoint,
  onUpdateAnthropicEndpoint,
  onUpdateApiKey,
  accountDeployment,
  onUpdateDeployment,
  onUpdateDeploymentModel,
  onUpdateEnabled,
  onDelete,
  onCopy,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(true);
  const [deployCollapsed, setDeployCollapsed] = useState(true);
  const [showDeployConfirm, setShowDeployConfirm] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [lastDeploymentName, setLastDeploymentName] = useState<string | null>(
    null
  );
  const [lastDeploymentState, setLastDeploymentState] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(region.enabled !== false);

  // 判断当前区域名是否为自定义（不在预设列表中）
  const isCustomRegion = !PRESET_REGIONS.some((r) => r.value === region.name);
  const [showCustomInput, setShowCustomInput] = useState(isCustomRegion);

  // 获取当前区域的显示标签
  const getRegionLabel = (value: string) => {
    const found = PRESET_REGIONS.find((r) => r.value === value);
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

  const selectedModels = useMemo(
    () => parseModels(region.modelsText),
    [region.modelsText]
  );
  const selectedSet = useMemo(() => new Set(selectedModels), [selectedModels]);
  const regionModels = useMemo(
    () => orderModelsByMaster(selectedModels, masterModels),
    [selectedModels, masterModels]
  );

  // 隐私模式下显示的区域名称
  const displayRegionName = privacyMode
    ? t('regions.region') + ` ${regionIndex + 1}`
    : region.name || t('regions.region') + ` ${regionIndex + 1}`;

  const groupedFilteredModels = useMemo(() => {
    const set = new Set(filteredModels);
    return masterGroups
      .map((models, idx) => ({
        idx,
        models: models.filter((m) => set.has(m)),
      }))
      .filter((g) => g.models.length > 0);
  }, [filteredModels, masterGroups]);

  // =============== 模型部署（Azure Portal） ===============
  const deploymentResourceName = region.deployment?.resourceName || '';
  const deploymentLocation = region.deployment?.location || region.name || '';

  const selectedDeploymentRows = useMemo(() => {
    const modelMap = region.deployment?.models || {};
    return regionModels.map((modelName) => {
      const cfg = modelMap[modelName] || {};
      return {
        modelName,
        deploymentName: cfg.deploymentName ?? modelName,
        version: cfg.version ?? '',
        capacity: cfg.capacity ?? 1000,
      };
    });
  }, [region.deployment?.models, regionModels]);

  const validateDeployInputs = useCallback((): string | null => {
    const a = accountDeployment;
    if (!a?.subscriptionId?.trim())
      return t(
        'regions.deployMissingSubscriptionId',
        '请先在账号里填写 Subscription ID'
      );
    if (!a?.resourceGroup?.trim())
      return t(
        'regions.deployMissingResourceGroup',
        '请先在账号里填写 Resource Group'
      );

    const derived = extractAzureResourceName(region.openaiEndpoint || '');
    const resourceName =
      deploymentResourceName.trim() || (derived || '').trim();
    if (!resourceName)
      return t(
        'regions.deployMissingResourceName',
        '请先填写 AOAI 资源名称（resourceName）'
      );
    if (!deploymentLocation.trim())
      return t(
        'regions.deployMissingLocation',
        '请先填写 Azure 区域（location）'
      );
    if (regionModels.length === 0)
      return t('regions.deployNoModels', '当前区域没有已选模型');

    const seen = new Set<string>();
    for (const row of selectedDeploymentRows) {
      if (!row.deploymentName.trim()) {
        return t(
          'regions.deployMissingDeploymentName',
          'deploymentName 不能为空'
        );
      }
      if (seen.has(row.deploymentName.trim())) {
        return t(
          'regions.deployDuplicateDeploymentName',
          'deploymentName 不能重复'
        );
      }
      seen.add(row.deploymentName.trim());

      if (!row.version.trim()) {
        return t('regions.deployMissingVersion', '请为所有模型填写 version');
      }
      if (!Number.isInteger(row.capacity) || row.capacity <= 0) {
        return t('regions.deployInvalidCapacity', 'capacity 必须是正整数');
      }
    }

    return null;
  }, [
    accountDeployment,
    deploymentLocation,
    deploymentResourceName,
    region.openaiEndpoint,
    regionModels.length,
    selectedDeploymentRows,
    t,
  ]);

  const handleAutoFillDeployInfo = useCallback(() => {
    const derived = extractAzureResourceName(region.openaiEndpoint || '');
    const patch: Partial<RegionDeploymentConfig> = {};
    if (!deploymentResourceName.trim() && derived) patch.resourceName = derived;
    if (!deploymentLocation.trim() && region.name) patch.location = region.name;
    if (Object.keys(patch).length > 0) {
      onUpdateDeployment?.(patch);
      toast.success(t('regions.deployAutoFilled', '已自动填充部署信息'));
    } else {
      toast.success(t('regions.deployNothingToFill', '暂无可自动填充的字段'));
    }
  }, [
    deploymentLocation,
    deploymentResourceName,
    onUpdateDeployment,
    region.name,
    region.openaiEndpoint,
    toast,
    t,
  ]);

  const handleDeploy = useCallback(async () => {
    const err = validateDeployInputs();
    if (err) {
      toast.error(err);
      return;
    }

    const a = accountDeployment as AccountDeploymentConfig;
    const derived = extractAzureResourceName(region.openaiEndpoint || '');
    const resourceName =
      deploymentResourceName.trim() || (derived || '').trim();
    const location = deploymentLocation.trim();

    const templateInput = {
      resourceName,
      location,
      modelDeployments: selectedDeploymentRows.map((row) => ({
        deploymentName: row.deploymentName.trim(),
        modelName: row.modelName,
        version: row.version.trim(),
        capacity: row.capacity,
      })),
    };

    const json = stringifyAzureOpenAiArmTemplate(templateInput);

    const safeName = `arm-openai-${resourceName}-${region.name}-${new Date()
      .toISOString()
      .slice(0, 10)}`
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);

    setDeploying(true);
    setLastDeploymentName(safeName);
    setLastDeploymentState('Portal');
    try {
      // copy template
      onCopy(json, `${displayRegionName} ARM Template`);

      // download template
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const subId = a.subscriptionId!.trim();
      const rg = a.resourceGroup!.trim();
      window.open(
        buildAzurePortalResourceGroupOverviewUrl({
          subscriptionId: subId,
          resourceGroup: rg,
        }),
        '_blank',
        'noopener,noreferrer'
      );

      toast.success(
        t(
          'regions.deployStarted',
          '已打开 Azure Portal，并导出模板（已复制+已下载）'
        )
      );
    } catch (e: any) {
      toast.error(
        t('regions.deployFailed', '操作失败：{{msg}}', {
          msg: e?.message || String(e),
        })
      );
    } finally {
      setDeploying(false);
    }
  }, [
    accountDeployment,
    deploymentLocation,
    deploymentResourceName,
    displayRegionName,
    onCopy,
    region.name,
    region.openaiEndpoint,
    selectedDeploymentRows,
    toast,
    t,
    validateDeployInputs,
  ]);

  const toggleModel = (modelId: string) => {
    const set = new Set(parseModels(region.modelsText));
    if (set.has(modelId)) {
      set.delete(modelId);
    } else {
      set.add(modelId);
    }
    onUpdateModelsText(
      orderModelsByMaster(Array.from(set), masterModels).join(',')
    );
  };

  const selectAll = () => {
    if (masterModels.length === 0) return;
    onUpdateModelsText(masterModels.join(','));
  };

  const selectGroup = (models: string[]) => {
    if (models.length === 0) return;
    const set = new Set(parseModels(region.modelsText));
    for (const model of models) {
      set.add(model);
    }
    onUpdateModelsText(
      orderModelsByMaster(Array.from(set), masterModels).join(',')
    );
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
      onUpdateModelsText(
        orderModelsByMaster(Array.from(mergedSet), masterModels).join(',')
      );
      toast.success(t('regions.pasteSuccess', { count: models.length }));
    } catch {
      toast.error(t('regions.pasteFailed'));
    }
  };

  const isDisabled = region.enabled === false;

  // 未启用区域收起时的简化视图
  if (isDisabled && !isExpanded) {
    return (
      <div className="rounded-lg border border-gray-800 p-2.5 bg-background opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {regionIndex + 1}.
            </span>
            <span className="text-sm">{displayRegionName}</span>
            <span className="text-xs text-gray-500">
              ({t('regions.disabled')})
            </span>
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
          'rounded-lg border border-gray-800 p-2.5 bg-background relative',
          isDisabled && 'opacity-50'
        )}
      >
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

            {/* 区域编号 + 区域名称 */}
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
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                  <option value="__custom__">
                    {t('regions.customRegion')}
                  </option>
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
              {/* 复制按钮 */}
              {region.apiKey && (
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
        </div>

        {/* 第二行: OpenAI Endpoint + Anthropic Endpoint */}
        <div className="flex flex-col md:flex-row md:items-start gap-3 mb-2 pl-7">
          {/* OpenAI Endpoint */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
              <span>{t('regions.openaiEndpoint')}</span>
              {region.openaiEndpoint &&
                region.anthropicEndpoint &&
                !region.openaiEndpointManualOverride && (
                  <span
                    className="text-cyan-400"
                    title={t('regions.endpointAutoSynced', {
                      type: 'Anthropic',
                    })}
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
                value={
                  privacyMode
                    ? maskEndpoint(region.openaiEndpoint || '')
                    : region.openaiEndpoint || ''
                }
                onChange={(e) => handleOpenAIEndpointChange(e.target.value)}
                placeholder="https://xxx.openai.azure.com"
                disabled={privacyMode}
              />
              {/* 复制按钮 */}
              {region.openaiEndpoint && (
                <button
                  type="button"
                  onClick={() =>
                    onCopy(region.openaiEndpoint || '', 'OpenAI Endpoint')
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

          {/* Anthropic Endpoint */}
          <div className="flex-1 min-w-0">
            <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
              <span>{t('regions.anthropicEndpoint')}</span>
              {region.anthropicEndpoint &&
                region.openaiEndpoint &&
                !region.anthropicEndpointManualOverride && (
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
                value={
                  privacyMode
                    ? maskEndpoint(region.anthropicEndpoint || '')
                    : region.anthropicEndpoint || ''
                }
                onChange={(e) => handleAnthropicEndpointChange(e.target.value)}
                placeholder="https://xxx.services.ai.azure.com"
                disabled={privacyMode}
              />
              {/* 复制按钮 */}
              {region.anthropicEndpoint && (
                <button
                  type="button"
                  onClick={() =>
                    onCopy(region.anthropicEndpoint || '', 'Anthropic Endpoint')
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

          {/* 模型选择器 - 按全局目录分组显示 */}
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
                  {groupedFilteredModels.map(({ idx, models }) => {
                    const groupTitle = t('common.group', { index: idx + 1 });
                    const selectedModels = models.filter((m) =>
                      selectedSet.has(m)
                    );
                    const selectedCount = selectedModels.length;

                    return (
                      <div
                        key={`group-${idx}`}
                        className="border border-gray-800 rounded-lg p-2"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={clsx(
                              'text-xs font-medium',
                              'text-cyan-300'
                            )}
                          >
                            {groupTitle}
                            <span className="text-muted-foreground ml-1">
                              ({selectedCount}/{models.length})
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            {/* 复制此分组已选模型 */}
                            {selectedModels.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  onCopy(
                                    buildCopyString(selectedModels),
                                    `${displayRegionName} - ${groupTitle}`
                                  )
                                }
                                className="px-1.5 py-0.5 rounded border border-gray-700 bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-slate-800 hover:text-foreground"
                                title={t('regions.copyGroupModels')}
                              >
                                📋
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => selectGroup(models)}
                              className="px-1.5 py-0.5 rounded border border-gray-700 bg-transparent text-muted-foreground text-xs cursor-pointer hover:bg-slate-800 hover:text-foreground"
                            >
                              {t('regions.selectGroup')}
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
              <span>
                {t('regions.selectedCount', { count: regionModels.length })}
              </span>
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

        {/* 模型部署 */}
        <div className="border-t border-gray-800 pt-2 mt-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDeployCollapsed((prev) => !prev)}
              className="flex items-center gap-1.5 bg-transparent text-foreground text-xs cursor-pointer border-none p-0"
            >
              <span className="inline-block w-3.5 text-center text-muted-foreground">
                {deployCollapsed ? '▶' : '▼'}
              </span>
              <span>{t('regions.deployTitle', '模型部署')}</span>
              {regionModels.length > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({regionModels.length})
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoFillDeployInfo}
                className="px-2 py-0.5 rounded-full border border-gray-700 bg-background text-foreground text-xs cursor-pointer hover:bg-slate-800"
                disabled={privacyMode}
              >
                {t('regions.deployAutoFill', '自动填充')}
              </button>
              <button
                type="button"
                disabled={privacyMode || deploying || regionModels.length === 0}
                onClick={() => setShowDeployConfirm(true)}
                className={clsx(
                  'px-2 py-0.5 rounded-full border text-xs cursor-pointer transition-colors',
                  privacyMode || deploying || regionModels.length === 0
                    ? 'border-gray-700 bg-gray-900/40 text-gray-500 cursor-not-allowed'
                    : 'border-cyan-500 bg-cyan-900/20 text-cyan-200 hover:bg-cyan-900/30'
                )}
              >
                {deploying
                  ? t('regions.deploying', '部署中...')
                  : t('regions.deployNow', '一键部署')}
              </button>
            </div>
          </div>

          {!deployCollapsed && (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {t(
                      'regions.deployResourceName',
                      'resourceName (AOAI 资源名称)'
                    )}
                  </label>
                  <input
                    className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={deploymentResourceName}
                    onChange={(e) =>
                      onUpdateDeployment?.({ resourceName: e.target.value })
                    }
                    placeholder="my-aoai"
                    disabled={privacyMode}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {t('regions.deployLocation', 'location (Azure 区域)')}
                  </label>
                  <input
                    className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={deploymentLocation}
                    onChange={(e) =>
                      onUpdateDeployment?.({ location: e.target.value })
                    }
                    placeholder="eastus2"
                    disabled={privacyMode}
                  />
                </div>
              </div>

              {lastDeploymentName && (
                <div className="text-xs text-muted-foreground">
                  {t('regions.deployLast', '最近一次部署')}:{' '}
                  <span className="font-mono">{lastDeploymentName}</span>
                  {lastDeploymentState ? (
                    <span className="ml-2">({lastDeploymentState})</span>
                  ) : null}
                </div>
              )}

              <div className="overflow-auto border border-gray-800 rounded-lg">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-800">
                      <th className="py-2 px-3">
                        {t('regions.deployModel', 'model')}
                      </th>
                      <th className="py-2 px-3">
                        {t('regions.deployDeploymentName', 'deploymentName')}
                      </th>
                      <th className="py-2 px-3">
                        {t('regions.deployVersion', 'version')}
                      </th>
                      <th className="py-2 px-3 w-[140px]">
                        {t('regions.deployCapacity', 'capacity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDeploymentRows.map((row) => (
                      <tr
                        key={row.modelName}
                        className="border-b border-gray-900/60"
                      >
                        <td className="py-2 px-3 font-mono text-xs text-gray-200">
                          {row.modelName}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={row.deploymentName}
                            onChange={(e) =>
                              onUpdateDeploymentModel?.(row.modelName, {
                                deploymentName: e.target.value,
                              })
                            }
                            disabled={privacyMode}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={row.version}
                            onChange={(e) =>
                              onUpdateDeploymentModel?.(row.modelName, {
                                version: e.target.value,
                              })
                            }
                            placeholder="2024-07-18"
                            disabled={privacyMode}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={String(row.capacity)}
                            onChange={(e) => {
                              const num = Number(e.target.value);
                              onUpdateDeploymentModel?.(row.modelName, {
                                capacity: Number.isFinite(num) ? num : 0,
                              });
                            }}
                            inputMode="numeric"
                            placeholder="1000"
                            disabled={privacyMode}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

      <ConfirmDialog
        open={showDeployConfirm}
        onOpenChange={setShowDeployConfirm}
        title={t('regions.deployConfirmTitle', '确认跳转 Azure Portal 部署')}
        description={t(
          'regions.deployConfirmDesc',
          '该操作将导出 ARM 模板（复制+下载），并跳转到 Azure Portal（资源组页面），请在 Portal 中执行自定义部署。可能产生费用，确认继续？'
        )}
        confirmText={t('regions.deployConfirmBtn', '确认部署')}
        cancelText={t('common.cancel')}
        variant="warning"
        onConfirm={handleDeploy}
      />
    </>
  );
};

RegionCard.displayName = 'RegionCard';
