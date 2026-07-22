import React, { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { useToast } from '../../../hooks/useToast';
import { RegionDeploymentSection } from './RegionDeploymentSection';
import { RegionEndpointSection } from './RegionEndpointSection';
import { RegionIdentitySection } from './RegionIdentitySection';
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
} from '../../../utils/common';
import type {
  GeneratedRegionIdentityBundle,
  LocalRegion as ImportedLocalRegion,
  RegionDeploymentConfig,
  RegionDeploymentModelConfig,
  ServicePrincipalCredential,
} from '../../../hooks/useLocalAzureAccounts';

export type LocalRegion = ImportedLocalRegion;

export interface RegionCardProps {
  region: LocalRegion;
  regionIndex?: number;
  privacyMode?: boolean;
  accountId?: string;
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

export const RegionCard: React.FC<RegionCardProps> = ({
  region,
  regionIndex = 0,
  privacyMode = false,
  accountId,
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
  const { t } = useTranslation();
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [pendingGeneratedBundle, setPendingGeneratedBundle] =
    useState<GeneratedRegionIdentityBundle | null>(null);

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
        <RegionIdentitySection
          region={region}
          regionIndex={regionIndex}
          privacyMode={privacyMode}
          displayRegionName={displayRegionName}
          deploymentResourceName={deploymentResourceName}
          canAutoGenerate={canAutoGenerate}
          onUpdateEnabled={onUpdateEnabled}
          onUpdateName={onUpdateName}
          onUpdateApiKey={onUpdateApiKey}
          onUpdateDeployment={onUpdateDeployment}
          onAutoGenerate={handleAutoGenerateClick}
          onCopy={onCopy}
        />

        {/* Region endpoints */}

        <RegionEndpointSection
          region={region}
          privacyMode={privacyMode}
          onFoundryProjectEndpointChange={handleFoundryProjectEndpointChange}
          onOpenAIEndpointChange={handleOpenAIEndpointChange}
          onAiServicesEndpointChange={handleAiServicesEndpointChange}
          onAnthropicEndpointChange={handleAnthropicEndpointChange}
          onCopy={onCopy}
        />

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
        <RegionDeploymentSection
          region={region}
          regionModels={regionModels}
          masterModels={masterModels}
          privacyMode={privacyMode}
          accountId={accountId}
          accountName={accountName}
          subscriptionId={subscriptionId}
          servicePrincipal={servicePrincipal}
          azureCliResourceGroupName={azureCliResourceGroupName}
          displayRegionName={displayRegionName}
          onUpdateDeploymentModel={onUpdateDeploymentModel}
          onCopy={onCopy}
        />
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
