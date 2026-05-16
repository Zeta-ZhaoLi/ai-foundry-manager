import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { RegionModelSelector } from './RegionModelSelector';
import {
  deriveAzureEndpointSetFromAny,
  extractAzureResourceName,
  generateRegionIdentityBundleFromAccountEmail,
  normalizeAiServicesEndpoint,
  normalizeFoundryProjectEndpoint,
  normalizeOpenAIEndpoint,
  normalizeAnthropicEndpoint,
  orderModelsByMaster,
  parseModels,
  resolveEffectiveFoundryProjectIdentity,
} from '../../../utils/common';
import type {
  GeneratedRegionIdentityBundle,
  LocalRegion as ImportedLocalRegion,
  RegionDeploymentConfig,
  RegionDeploymentModelConfig,
  ServicePrincipalCredential,
} from '../../../hooks/useLocalAzureAccounts';

import {
  getTemplateModelDeploymentByDeploymentNameMap,
  stringifyAzureOpenAiMainTemplate,
} from '../../../utils/armTemplate';
import {
  AZURE_CLI_DEPLOYMENT_COMMAND,
  AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND,
  buildAzureCliDeploymentScript,
  buildAzureCliPowerShellDeploymentScript,
  resolveAzureCliDeploymentRows,
  toAzureCliDeploymentModels,
} from '../../../utils/azureCliDeployment';

export type LocalRegion = ImportedLocalRegion;

export interface RegionCardProps {
  region: LocalRegion;
  regionIndex?: number;
  privacyMode?: boolean;
  accountId: string;
  accountName: string;
  subscriptionId?: string;
  servicePrincipal?: ServicePrincipalCredential;
  azureCliResourceGroupName?: string;
  masterModels: string[];
  masterGroups: string[][];
  masterGroupLines: string[][][];
  filteredModels: string[];
  onUpdateName: (name: string) => void;
  onUpdateModelsText: (text: string) => void;
  onUpdateOpenaiEndpoint: (endpoint: string) => void;
  onUpdateFoundryProjectEndpoint?: (endpoint: string) => void;
  onUpdateAiServicesEndpoint?: (endpoint: string) => void;
  onUpdateAnthropicEndpoint: (endpoint: string) => void;
  onUpdateApiKey: (apiKey: string) => void;
  onUpdateDeployment?: (patch: Partial<RegionDeploymentConfig>) => void;
  onApplyGeneratedIdentity?: (bundle: GeneratedRegionIdentityBundle) => void;
  onUpdateDeploymentModel?: (
    modelName: string,
    patch: Partial<RegionDeploymentModelConfig>
  ) => void;
  siblingResourceNames?: string[];
  onUpdateEnabled: (enabled: boolean) => void;
  onDelete: () => void;
  onCopy: (text: string, label: string) => void;
}

// 闅愮妯″紡涓嬫墦鐮?Endpoint
const maskEndpoint = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.hostname.split('.');
    if (parts.length >= 2) {
      parts[0] = '***';
    }
    return `${parsed.protocol}//${parts.join('.')}`;
  } catch {
    return '***';
  }
};

// 棰勮 Azure 鍖哄煙鍒楄〃 (value: API鍊? label: 鏄剧ず鍚嶇О)
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
  subscriptionId = '',
  servicePrincipal,
  azureCliResourceGroupName,
  masterModels,
  masterGroups,
  masterGroupLines,
  filteredModels,
  onUpdateName,
  onUpdateModelsText,
  onUpdateOpenaiEndpoint,
  onUpdateFoundryProjectEndpoint,
  onUpdateAiServicesEndpoint,
  onUpdateAnthropicEndpoint,
  onUpdateApiKey,
  onUpdateDeployment,
  onApplyGeneratedIdentity,
  onUpdateDeploymentModel,
  siblingResourceNames = [],
  onUpdateEnabled,
  onDelete,
  onCopy,
}) => {
  type DeploymentBulkCycleState = 'none' | 'invert' | 'all';
  const { t } = useTranslation();
  const toast = useToast();
  const [deployCollapsed, setDeployCollapsed] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [overwriteAzureCliDeployments, setOverwriteAzureCliDeployments] =
    useState(true);
  const [deploymentBulkCycleState, setDeploymentBulkCycleState] =
    useState<DeploymentBulkCycleState>('none');
  const [pendingGeneratedBundle, setPendingGeneratedBundle] =
    useState<GeneratedRegionIdentityBundle | null>(null);
  const deploymentBulkCheckboxRef = useRef<HTMLInputElement>(null);

  // 鍒ゆ柇褰撳墠鍖哄煙鍚嶆槸鍚︿负鑷畾涔夛紙涓嶅湪棰勮鍒楄〃涓級
  const isCustomRegion = !PRESET_REGIONS.some((r) => r.value === region.name);
  const [showCustomInput, setShowCustomInput] = useState(isCustomRegion);

  const applyEndpointSet = useCallback(
    (set: {
      foundryProjectEndpoint: string;
      openaiEndpoint: string;
      aiServicesEndpoint: string;
      anthropicEndpoint: string;
    }) => {
      onUpdateFoundryProjectEndpoint?.(set.foundryProjectEndpoint);
      onUpdateOpenaiEndpoint(set.openaiEndpoint);
      onUpdateAiServicesEndpoint?.(set.aiServicesEndpoint);
      onUpdateAnthropicEndpoint(set.anthropicEndpoint);
    },
    [
      onUpdateAiServicesEndpoint,
      onUpdateAnthropicEndpoint,
      onUpdateFoundryProjectEndpoint,
      onUpdateOpenaiEndpoint,
    ]
  );

  const handleFoundryProjectEndpointChange = (newValue: string) => {
    const normalized = normalizeFoundryProjectEndpoint(newValue);
    const generated = deriveAzureEndpointSetFromAny(normalized);
    if (generated) {
      applyEndpointSet(generated);
      const resourceName = extractAzureResourceName(normalized);
      if (resourceName) {
        onUpdateDeployment?.({ resourceName });
      }
      return;
    }
    onUpdateFoundryProjectEndpoint?.(normalized);
  };

  const handleOpenAIEndpointChange = (newValue: string) => {
    const normalized = normalizeOpenAIEndpoint(newValue);
    const generated = deriveAzureEndpointSetFromAny(normalized);
    if (generated) {
      applyEndpointSet(generated);
      return;
    }
    onUpdateOpenaiEndpoint(normalized);
  };

  const handleAiServicesEndpointChange = (newValue: string) => {
    const normalized = normalizeAiServicesEndpoint(newValue);
    const generated = deriveAzureEndpointSetFromAny(normalized);
    if (generated) {
      applyEndpointSet(generated);
      return;
    }
    onUpdateAiServicesEndpoint?.(normalized);
  };

  const handleAnthropicEndpointChange = (newValue: string) => {
    const normalized = normalizeAnthropicEndpoint(newValue);
    const generated = deriveAzureEndpointSetFromAny(normalized);
    if (generated) {
      applyEndpointSet(generated);
      return;
    }
    onUpdateAnthropicEndpoint(normalized);
  };

  const selectedModels = useMemo(
    () => parseModels(region.modelsText),
    [region.modelsText]
  );
  const regionModels = useMemo(
    () => orderModelsByMaster(selectedModels, masterModels),
    [selectedModels, masterModels]
  );

  // 闅愮妯″紡涓嬫樉绀虹殑鍖哄煙鍚嶇О
  const displayRegionName = privacyMode
    ? t('regions.region') + ` ${regionIndex + 1}`
    : region.name || t('regions.region') + ` ${regionIndex + 1}`;

  // =============== 妯″瀷閮ㄧ讲锛圓zure Portal锛?===============
  const deploymentResourceName = region.deployment?.resourceName || '';
  const deploymentLocation = region.name || '';
  const regionInputSources = region.inputSources || {};
  const canAutoGenerate = Boolean(
    onApplyGeneratedIdentity ||
      (onUpdateDeployment &&
        onUpdateFoundryProjectEndpoint &&
        onUpdateAiServicesEndpoint)
  );

  const applyGeneratedBundle = useCallback(
    (bundle: GeneratedRegionIdentityBundle) => {
      if (onApplyGeneratedIdentity) {
        onApplyGeneratedIdentity(bundle);
        return;
      }

      onUpdateDeployment?.({ resourceName: bundle.resourceName });
      onUpdateFoundryProjectEndpoint?.(bundle.foundryProjectEndpoint);
      onUpdateOpenaiEndpoint(bundle.openaiEndpoint);
      onUpdateAiServicesEndpoint?.(bundle.aiServicesEndpoint);
      onUpdateAnthropicEndpoint(bundle.anthropicEndpoint);
    },
    [
      onApplyGeneratedIdentity,
      onUpdateAiServicesEndpoint,
      onUpdateAnthropicEndpoint,
      onUpdateDeployment,
      onUpdateFoundryProjectEndpoint,
      onUpdateOpenaiEndpoint,
    ]
  );

  const regionHasManualGenerationTargets = useMemo(() => {
    const fields: Array<{
      value: string;
      source?: 'generated' | 'manual';
    }> = [
      {
        value: deploymentResourceName,
        source: regionInputSources.resourceName,
      },
      {
        value: region.foundryProjectEndpoint || '',
        source: regionInputSources.foundryProjectEndpoint,
      },
      {
        value: region.openaiEndpoint || '',
        source: regionInputSources.openaiEndpoint,
      },
      {
        value: region.aiServicesEndpoint || '',
        source: regionInputSources.aiServicesEndpoint,
      },
      {
        value: region.anthropicEndpoint || '',
        source: regionInputSources.anthropicEndpoint,
      },
    ];

    return fields.some(
      ({ value, source }) => value.trim() && source !== 'generated'
    );
  }, [
    deploymentResourceName,
    region.aiServicesEndpoint,
    region.anthropicEndpoint,
    region.foundryProjectEndpoint,
    region.openaiEndpoint,
    regionInputSources.aiServicesEndpoint,
    regionInputSources.anthropicEndpoint,
    regionInputSources.foundryProjectEndpoint,
    regionInputSources.openaiEndpoint,
    regionInputSources.resourceName,
  ]);

  const handleAutoGenerateClick = useCallback(() => {
    const result = generateRegionIdentityBundleFromAccountEmail(
      accountName,
      siblingResourceNames
    );

    if (!result.ok || !result.bundle) {
      toast.error(
        result.error === 'invalid_account_email'
          ? t('regions.generateRequiresEmailAccountName')
          : t('regions.generateFailed')
      );
      return;
    }

    if (regionHasManualGenerationTargets) {
      setPendingGeneratedBundle(result.bundle);
      setShowGenerateConfirm(true);
      return;
    }

    applyGeneratedBundle(result.bundle);
  }, [
    accountName,
    applyGeneratedBundle,
    regionHasManualGenerationTargets,
    siblingResourceNames,
    t,
    toast,
  ]);

  const templateByDeploymentNameMap = useMemo(
    () => getTemplateModelDeploymentByDeploymentNameMap(),
    []
  );

  const selectedDeploymentRows = useMemo(() => {
    return resolveAzureCliDeploymentRows(
      regionModels,
      region.deployment?.models || {}
    );
  }, [region.deployment?.models, regionModels]);

  const allMasterDeploymentRows = useMemo(
    () => resolveAzureCliDeploymentRows(masterModels),
    [masterModels]
  );
  const allMasterAzureCliModels = useMemo(
    () => toAzureCliDeploymentModels(allMasterDeploymentRows),
    [allMasterDeploymentRows]
  );

  const validateDeployInputs = useCallback((options?: {
    requireCapacity?: boolean;
  }): string | null => {
    const requireCapacity = options?.requireCapacity !== false;
    const resourceName = deploymentResourceName.trim();
    if (!resourceName) return t('regions.deployMissingResourceName');
    if (!deploymentLocation.trim()) return t('regions.deployMissingLocation');

    const effectiveFoundryProject = resolveEffectiveFoundryProjectIdentity(
      resourceName,
      region.foundryProjectEndpoint || ''
    );
    if (
      !effectiveFoundryProject.ok &&
      effectiveFoundryProject.error === 'invalid_foundry_project_endpoint'
    ) {
      return t('regions.deployInvalidFoundryProjectEndpoint');
    }

    if (regionModels.length === 0) return t('regions.deployNoModels');

    const activeRows = selectedDeploymentRows.filter(
      (row) => row.enabled !== false
    );
    if (activeRows.length === 0) return t('regions.deployNoEnabledModels');

    const seen = new Set<string>();
    for (const row of activeRows) {
      const deploymentName = row.deploymentName.trim();
      const rowModelName = row.modelName.trim();
      if (!deploymentName) {
        return t('regions.deployMissingDeploymentName');
      }
      const deploymentMatch = templateByDeploymentNameMap.get(deploymentName);
      const sameModelByTemplate =
        deploymentMatch &&
        deploymentMatch.modelName.trim().toLowerCase() ===
          rowModelName.toLowerCase();
      if (deploymentMatch && !sameModelByTemplate) {
        return t('regions.deployDeploymentNameModelMismatch');
      }
      if (
        !deploymentName.toLowerCase().includes(rowModelName.toLowerCase()) &&
        !sameModelByTemplate
      ) {
        return t('regions.deployDeploymentNameMustContainModel');
      }
      if (seen.has(deploymentName)) {
        return t('regions.deployDuplicateDeploymentName');
      }
      seen.add(deploymentName);

      if (!row.version.trim()) {
        return t('regions.deployMissingVersion');
      }
      if (!row.modelFormat.trim()) {
        return t('regions.deployMissingModelFormat');
      }
      if (
        requireCapacity &&
        (!Number.isInteger(row.capacity) || row.capacity <= 0)
      ) {
        return t('regions.deployInvalidCapacity');
      }
    }

    return null;
  }, [
    deploymentLocation,
    deploymentResourceName,
    region.foundryProjectEndpoint,
    regionModels.length,
    selectedDeploymentRows,
    templateByDeploymentNameMap,
    t,
  ]);

  const handleArmDeploy = useCallback(() => {
    const err = validateDeployInputs({ requireCapacity: true });
    if (err) {
      toast.error(err);
      return;
    }

    const resourceName = deploymentResourceName.trim();
    const location = deploymentLocation.trim();
    const effectiveFoundryProject = resolveEffectiveFoundryProjectIdentity(
      resourceName,
      region.foundryProjectEndpoint || ''
    );

    if (!effectiveFoundryProject.ok || !effectiveFoundryProject.identity) {
      toast.error(t('regions.deployFailed', { msg: 'project identity invalid' }));
      return;
    }

    const templateInput = {
      resourceName,
      projectName: effectiveFoundryProject.identity.projectId,
      location,
      modelDeployments: selectedDeploymentRows
        .filter((row) => row.enabled !== false)
        .map((row) => ({
          deploymentName: row.deploymentName.trim(),
          modelName: row.modelName,
          version: row.version.trim(),
          modelFormat: row.modelFormat.trim(),
          capacity: row.capacity,
        })),
    };

    try {
      const json = stringifyAzureOpenAiMainTemplate(templateInput);
      onCopy(json, `${displayRegionName} - ${t('regions.deployTitle')}`);
      toast.success(t('regions.armDeployCodeCopied'));
    } catch (e: unknown) {
      toast.error(
        t('regions.deployFailed', {
          msg: e instanceof Error ? e.message : String(e),
        })
      );
    }
  }, [
    deploymentLocation,
    deploymentResourceName,
    displayRegionName,
    onCopy,
    region.foundryProjectEndpoint,
    selectedDeploymentRows,
    toast,
    t,
    validateDeployInputs,
  ]);

  const selectedAzureCliModels = useMemo(
    () => toAzureCliDeploymentModels(selectedDeploymentRows),
    [selectedDeploymentRows]
  );

  const handleAzureCliDeployCode = useCallback((mode: 'selected' | 'all', shell: 'bash' | 'powershell' = 'bash') => {
    const resourceName = deploymentResourceName.trim();
    if (!resourceName) {
      toast.error(t('regions.deployMissingResourceName'));
      return;
    }
    if (!azureCliResourceGroupName?.trim()) {
      toast.error(t('regions.deployMissingResourceGroupName'));
      return;
    }

    const models =
      mode === 'selected' ? selectedAzureCliModels : allMasterAzureCliModels;

    if (mode === 'selected' && models.length === 0) {
      toast.error(t('regions.deployNoEnabledModels'));
      return;
    }
    if (mode === 'all' && models.length === 0) {
      toast.error(t('regions.deployNoMasterModels'));
      return;
    }

    try {
      const input = {
        subscriptionId,
        servicePrincipal,
        accountEmail: accountName,
        resourceName,
        location: region.name || '',
        resourceGroupName: azureCliResourceGroupName,
        foundryProjectEndpoint: region.foundryProjectEndpoint || '',
        models,
        overwriteExisting: overwriteAzureCliDeployments,
      };
      const script =
        shell === 'powershell'
          ? buildAzureCliPowerShellDeploymentScript(input)
          : buildAzureCliDeploymentScript(input);
      onCopy(
        script,
        `${displayRegionName} - ${t(
          shell === 'powershell'
            ? 'regions.azureCliDeployPowerShellCode'
            : 'regions.azureCliDeployCode'
        )} ${
          mode === 'selected'
            ? t('regions.azureCliDeploySelected')
            : t('regions.azureCliDeployAll')
        }`
      );
      toast.success(t('regions.azureCliDeployCodeCopied'));
    } catch (e: unknown) {
      toast.error(
        t('regions.deployFailed', {
          msg: e instanceof Error ? e.message : String(e),
        })
      );
    }
  }, [
    allMasterAzureCliModels,
    azureCliResourceGroupName,
    deploymentResourceName,
    displayRegionName,
    onCopy,
    region.foundryProjectEndpoint,
    region.name,
    selectedAzureCliModels,
    servicePrincipal,
    subscriptionId,
    toast,
    t,
    overwriteAzureCliDeployments,
  ]);

  const handleAzureCliDeployCommand = useCallback((shell: 'bash' | 'powershell' = 'bash') => {
    onCopy(
      shell === 'powershell'
        ? AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND
        : AZURE_CLI_DEPLOYMENT_COMMAND,
      `${displayRegionName} - ${t(
        shell === 'powershell'
          ? 'regions.azureCliDeployPowerShellCommand'
          : 'regions.azureCliDeployCommand'
      )}`
    );
    toast.success(t('regions.azureCliDeployCommandCopied'));
  }, [displayRegionName, onCopy, t, toast]);

  const applyDeploymentBulkSelection = useCallback(
    (action: DeploymentBulkCycleState) => {
      if (!onUpdateDeploymentModel) return;

      for (const row of selectedDeploymentRows) {
        let enabled = row.enabled !== false;
        if (action === 'all') {
          enabled = true;
        } else if (action === 'none') {
          enabled = false;
        } else {
          enabled = !enabled;
        }
        onUpdateDeploymentModel(row.sourceModel, { enabled });
      }
    },
    [onUpdateDeploymentModel, selectedDeploymentRows]
  );

  const handleDeploymentBulkCycle = useCallback(() => {
    const nextState: DeploymentBulkCycleState =
      deploymentBulkCycleState === 'none'
        ? 'invert'
        : deploymentBulkCycleState === 'invert'
          ? 'all'
          : 'none';
    applyDeploymentBulkSelection(nextState);
    setDeploymentBulkCycleState(nextState);
  }, [applyDeploymentBulkSelection, deploymentBulkCycleState]);

  useEffect(() => {
    if (!deploymentBulkCheckboxRef.current) return;
    deploymentBulkCheckboxRef.current.indeterminate =
      deploymentBulkCycleState === 'invert';
  }, [deploymentBulkCycleState]);


  const isDisabled = region.enabled === false;


  return (
    <>
      <div
        className={clsx(
          'rounded-lg border border-border p-2.5 bg-background relative',
          isDisabled && 'opacity-50'
        )}
      >
        {/* 鍒犻櫎鎸夐挳 - 缁濆瀹氫綅鍦ㄥ彸涓婅 */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="absolute top-2 right-2 px-2 py-1 rounded-lg border border-red-900 bg-transparent text-red-300 text-xs cursor-pointer hover:bg-red-900/30"
        >
          {t('regions.deleteRegion')}
        </button>

        {/* 绗竴琛? 鍚敤寮€鍏?+ 鍖哄煙缂栧彿 + 鍖哄煙鍚嶇О + API Key */}
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
                    鈫?                  </button>
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

          {/* API Key 甯︽樉绀?闅愯棌/澶嶅埗鎸夐挳 */}
          <div className="flex-1 min-w-0 pl-7 md:pl-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.apiKey')}
            </label>
            <div className="flex items-center gap-1">
              <input
                type={
                  privacyMode ? 'password' : showApiKey ? 'text' : 'password'
                }
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
                  onClick={handleAutoGenerateClick}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-700 bg-background text-xs text-muted-foreground hover:text-foreground hover:bg-slate-800 transition-colors shrink-0"
                  title={t('regions.autoGenerate')}
                >
                  {t('regions.autoGenerate')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 绗簩琛? 4绫?Endpoint 鑷姩浜掕浆 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 pl-7">
          <div className="min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.foundryProjectEndpoint')}
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
                    ? maskEndpoint(region.foundryProjectEndpoint || '')
                    : region.foundryProjectEndpoint || ''
                }
                onChange={(e) =>
                  handleFoundryProjectEndpointChange(e.target.value)
                }
                placeholder="https://xxx.services.ai.azure.com/api/projects/xxx"
                disabled={privacyMode}
              />
              {!privacyMode && region.foundryProjectEndpoint && (
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      region.foundryProjectEndpoint || '',
                      'Foundry Project Endpoint'
                    )
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

          <div className="min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.openaiEndpoint')}
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
              {!privacyMode && region.openaiEndpoint && (
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

          <div className="min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.aiServicesEndpoint')}
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
                    ? maskEndpoint(region.aiServicesEndpoint || '')
                    : region.aiServicesEndpoint || ''
                }
                onChange={(e) => handleAiServicesEndpointChange(e.target.value)}
                placeholder="https://xxx.cognitiveservices.azure.com"
                disabled={privacyMode}
              />
              {!privacyMode && region.aiServicesEndpoint && (
                <button
                  type="button"
                  onClick={() =>
                    onCopy(
                      region.aiServicesEndpoint || '',
                      'Azure AI Services Endpoint'
                    )
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

          <div className="min-w-0">
            <label className="text-xs text-muted-foreground block mb-1">
              {t('regions.anthropicEndpoint')}
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
                placeholder="https://xxx.services.ai.azure.com/anthropic"
                disabled={privacyMode}
              />
              {!privacyMode && region.anthropicEndpoint && (
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

        </div>

        <RegionModelSelector
          modelsText={region.modelsText}
          masterModels={masterModels}
          masterGroups={masterGroups}
          masterGroupLines={masterGroupLines}
          filteredModels={filteredModels}
          title={t('regions.modelsToggle')}
          copyLabel={`${t('accounts.account')} ${accountName} / ${t('regions.region')} ${displayRegionName}`}
          onChange={onUpdateModelsText}
          onCopy={onCopy}
        />

        {/* 妯″瀷閮ㄧ讲 */}
        <div className="border-t border-gray-800 pt-2 mt-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDeployCollapsed((prev) => !prev)}
              className="flex items-center gap-1.5 bg-transparent text-foreground text-xs cursor-pointer border-none p-0"
            >
              <span className="inline-block w-3.5 text-center text-muted-foreground">
                {deployCollapsed ? '▸' : '▾'}
              </span>
              <span>{t('regions.deployTitle')}</span>
              {regionModels.length > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({regionModels.length})
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                disabled={privacyMode || regionModels.length === 0}
                onClick={handleArmDeploy}
                className={clsx(
                  'px-2 py-0.5 rounded-full border text-xs cursor-pointer transition-colors',
                  privacyMode || regionModels.length === 0
                    ? 'border-gray-700 bg-gray-900/40 text-gray-500 cursor-not-allowed'
                    : 'border-cyan-500 bg-cyan-900/20 text-cyan-200 hover:bg-cyan-900/30'
                )}
              >
                {t('regions.armDeployCode')}
              </button>
              <label
                className={clsx(
                  'inline-flex items-center gap-1.5 text-xs',
                  privacyMode
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-muted-foreground cursor-pointer'
                )}
              >
                <input
                  type="checkbox"
                  checked={overwriteAzureCliDeployments}
                  disabled={privacyMode}
                  onChange={(e) =>
                    setOverwriteAzureCliDeployments(e.target.checked)
                  }
                  className="h-3.5 w-3.5"
                />
                <span>{t('regions.azureCliOverwriteExisting')}</span>
              </label>
              <div
                className={clsx(
                  'inline-flex items-center rounded-full border text-xs overflow-hidden',
                  privacyMode
                    ? 'border-gray-700 bg-gray-900/40 text-gray-500'
                    : 'border-emerald-500 bg-emerald-900/20 text-emerald-200'
                )}
              >
                <span className="px-2 py-0.5 border-r border-current/30">
                  {t('regions.azureCliDeployCode')} (
                </span>
                <button
                  type="button"
                  disabled={privacyMode || selectedAzureCliModels.length === 0}
                  aria-label={`${t('regions.azureCliDeployCode')} ${t(
                    'regions.azureCliDeploySelected'
                  )}`}
                  onClick={() => handleAzureCliDeployCode('selected')}
                  className={clsx(
                    'px-1.5 py-0.5 transition-colors',
                    privacyMode || selectedAzureCliModels.length === 0
                      ? 'cursor-not-allowed text-gray-500'
                      : 'cursor-pointer hover:bg-emerald-900/40'
                  )}
                >
                  {t('regions.azureCliDeploySelected')}
                </button>
                <span className="text-current/60">|</span>
                <button
                  type="button"
                  disabled={privacyMode || allMasterAzureCliModels.length === 0}
                  aria-label={`${t('regions.azureCliDeployCode')} ${t(
                    'regions.azureCliDeployAll'
                  )}`}
                  onClick={() => handleAzureCliDeployCode('all')}
                  className={clsx(
                    'px-1.5 py-0.5 transition-colors',
                    privacyMode || allMasterAzureCliModels.length === 0
                      ? 'cursor-not-allowed text-gray-500'
                      : 'cursor-pointer hover:bg-emerald-900/40'
                  )}
                >
                  {t('regions.azureCliDeployAll')}
                </button>
                <span className="text-current/60">|</span>
                <button
                  type="button"
                  disabled={privacyMode || selectedAzureCliModels.length === 0}
                  aria-label={`${t('regions.azureCliDeployPowerShellCode')} ${t(
                    'regions.azureCliDeploySelected'
                  )}`}
                  onClick={() =>
                    handleAzureCliDeployCode('selected', 'powershell')
                  }
                  className={clsx(
                    'px-1.5 py-0.5 transition-colors',
                    privacyMode || selectedAzureCliModels.length === 0
                      ? 'cursor-not-allowed text-gray-500'
                      : 'cursor-pointer hover:bg-emerald-900/40'
                  )}
                >
                  PS {t('regions.azureCliDeploySelected')}
                </button>
                <span className="text-current/60">|</span>
                <button
                  type="button"
                  disabled={privacyMode || allMasterAzureCliModels.length === 0}
                  aria-label={`${t('regions.azureCliDeployPowerShellCode')} ${t(
                    'regions.azureCliDeployAll'
                  )}`}
                  onClick={() => handleAzureCliDeployCode('all', 'powershell')}
                  className={clsx(
                    'px-1.5 py-0.5 transition-colors',
                    privacyMode || allMasterAzureCliModels.length === 0
                      ? 'cursor-not-allowed text-gray-500'
                      : 'cursor-pointer hover:bg-emerald-900/40'
                  )}
                >
                  PS {t('regions.azureCliDeployAll')}
                </button>
                <span className="px-2 py-0.5 border-l border-current/30">
                  )
                </span>
              </div>
              <button
                type="button"
                disabled={privacyMode}
                onClick={() => handleAzureCliDeployCommand('bash')}
                className={clsx(
                  'px-2 py-0.5 rounded-full border text-xs cursor-pointer transition-colors',
                  privacyMode
                    ? 'border-gray-700 bg-gray-900/40 text-gray-500 cursor-not-allowed'
                    : 'border-blue-500 bg-blue-900/20 text-blue-200 hover:bg-blue-900/30'
                )}
              >
                {t('regions.azureCliDeployCommand')}
              </button>
              <button
                type="button"
                disabled={privacyMode}
                onClick={() => handleAzureCliDeployCommand('powershell')}
                className={clsx(
                  'px-2 py-0.5 rounded-full border text-xs cursor-pointer transition-colors',
                  privacyMode
                    ? 'border-gray-700 bg-gray-900/40 text-gray-500 cursor-not-allowed'
                    : 'border-blue-500 bg-blue-900/20 text-blue-200 hover:bg-blue-900/30'
                )}
              >
                {t('regions.azureCliDeployPowerShellCommand')}
              </button>
            </div>
          </div>

          {!deployCollapsed && (
            <div className="mt-2 space-y-2">
              <div className="overflow-auto border border-gray-800 rounded-lg">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-800">
                      <th className="py-2 px-3 w-[96px]">
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            ref={deploymentBulkCheckboxRef}
                            type="checkbox"
                            checked={deploymentBulkCycleState === 'all'}
                            onChange={handleDeploymentBulkCycle}
                            disabled={
                              privacyMode ||
                              selectedDeploymentRows.length === 0 ||
                              !onUpdateDeploymentModel
                            }
                            aria-label={t('regions.deployInclude')}
                          />
                          <span>{t('regions.deployInclude')}</span>
                        </label>
                      </th>
                      <th className="py-2 px-3">{t('regions.deployModel')}</th>
                      <th className="py-2 px-3">
                        {t('regions.deployDeploymentName')}
                      </th>
                      <th className="py-2 px-3">
                        {t('regions.deployVersion')}
                      </th>
                      <th className="py-2 px-3">
                        {t('regions.deployModelFormat')}
                      </th>
                      <th className="py-2 px-3 w-[140px]">
                        {t('regions.deployCapacity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDeploymentRows.map((row) => (
                      <tr
                        key={row.sourceModel}
                        className="border-b border-gray-900/60"
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={row.enabled !== false}
                            onChange={(e) =>
                              onUpdateDeploymentModel?.(row.sourceModel, {
                                enabled: e.target.checked,
                              })
                            }
                            disabled={privacyMode}
                          />
                        </td>
                        <td className="py-2 px-3 font-mono text-xs text-gray-200">
                          {row.modelName}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={row.deploymentName}
                            onChange={(e) => {
                              const deploymentName = e.target.value;
                              const patch: Partial<RegionDeploymentModelConfig> =
                                {
                                  deploymentName,
                                };
                              const templateMatch =
                                templateByDeploymentNameMap.get(
                                  deploymentName.trim()
                                );
                              if (
                                templateMatch &&
                                templateMatch.modelName.trim().toLowerCase() ===
                                  row.modelName.trim().toLowerCase()
                              ) {
                                patch.version = templateMatch.version;
                                patch.modelFormat = templateMatch.modelFormat;
                                patch.capacity = templateMatch.capacity;
                              }
                              onUpdateDeploymentModel?.(row.sourceModel, patch);
                            }}
                            disabled={privacyMode}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={row.version}
                            onChange={(e) =>
                              onUpdateDeploymentModel?.(row.sourceModel, {
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
                            value={row.modelFormat}
                            onChange={(e) =>
                              onUpdateDeploymentModel?.(row.sourceModel, {
                                modelFormat: e.target.value,
                              })
                            }
                            placeholder="OpenAI"
                            disabled={privacyMode}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            className="w-full p-1.5 rounded-lg border border-gray-700 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={String(row.capacity)}
                            onChange={(e) => {
                              const num = Number(e.target.value);
                              onUpdateDeploymentModel?.(row.sourceModel, {
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
        open={showGenerateConfirm}
        onOpenChange={setShowGenerateConfirm}
        title={t('confirmDialog.generateRegionIdentity.title')}
        description={t('confirmDialog.generateRegionIdentity.description')}
        confirmText={t('regions.autoGenerate')}
        cancelText={t('common.cancel')}
        variant="warning"
        onConfirm={() => {
          if (pendingGeneratedBundle) {
            applyGeneratedBundle(pendingGeneratedBundle);
            setPendingGeneratedBundle(null);
          }
        }}
      />
    </>
  );
};

RegionCard.displayName = 'RegionCard';
