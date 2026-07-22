import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { useToast } from '../../../hooks/useToast';
import type {
  LocalRegion,
  RegionDeploymentModelConfig,
  ServicePrincipalCredential,
} from '../../../schemas/account';
import {
  AZURE_CLI_DEPLOYMENT_COMMAND,
  AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND,
  buildAzureCliDeploymentScript,
  buildAzureCliPowerShellDeploymentScript,
  resolveAzureCliDeploymentRows,
  toAzureCliDeploymentModels,
} from '../../../utils/azureCliDeployment';
import {
  getTemplateModelDeploymentByDeploymentNameMap,
  stringifyAzureOpenAiMainTemplate,
} from '../../../utils/armTemplate';
import { resolveEffectiveFoundryProjectIdentity } from '../../../utils/common';

type DeploymentBulkCycleState = 'none' | 'invert' | 'all';

export interface RegionDeploymentSectionProps {
  region: LocalRegion;
  regionModels: string[];
  masterModels: string[];
  privacyMode: boolean;
  accountId?: string;
  accountName: string;
  subscriptionId: string;
  servicePrincipal?: ServicePrincipalCredential;
  azureCliResourceGroupName?: string;
  displayRegionName: string;
  onUpdateDeploymentModel?: (
    modelName: string,
    patch: Partial<RegionDeploymentModelConfig>
  ) => void;
  onCopy: (text: string, label: string) => void;
}

export function RegionDeploymentSection({
  region,
  regionModels,
  masterModels,
  privacyMode,
  accountId,
  accountName,
  subscriptionId,
  servicePrincipal,
  azureCliResourceGroupName,
  displayRegionName,
  onUpdateDeploymentModel,
  onCopy,
}: RegionDeploymentSectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [deployCollapsed, setDeployCollapsed] = useState(true);
  const [overwriteAzureCliDeployments, setOverwriteAzureCliDeployments] =
    useState(false);
  const [deploymentBulkCycleState, setDeploymentBulkCycleState] =
    useState<DeploymentBulkCycleState>('none');
  const deploymentBulkCheckboxRef = useRef<HTMLInputElement>(null);
  const deploymentResourceName = region.deployment?.resourceName || '';
  const deploymentLocation = region.name || '';

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

  const validateDeployInputs = useCallback(
    (options?: { requireCapacity?: boolean }): string | null => {
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
    },
    [
      deploymentLocation,
      deploymentResourceName,
      region.foundryProjectEndpoint,
      regionModels.length,
      selectedDeploymentRows,
      templateByDeploymentNameMap,
      t,
    ]
  );

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
      toast.error(
        t('regions.deployFailed', { msg: 'project identity invalid' })
      );
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

  const handleAzureCliDeployCode = useCallback(
    (mode: 'selected' | 'all', shell: 'bash' | 'powershell' = 'bash') => {
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
          accountId,
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
    },
    [
      accountName,
      accountId,
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
    ]
  );

  const handleAzureCliDeployCommand = useCallback(
    (shell: 'bash' | 'powershell' = 'bash') => {
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
    },
    [displayRegionName, onCopy, t, toast]
  );

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

  return (
    <div className="mt-2 border-t border-border pt-2">
      <div className="flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setDeployCollapsed((prev) => !prev)}
          className="flex min-w-0 items-center gap-1.5 bg-transparent text-foreground text-xs cursor-pointer border-none p-0"
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
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
          <button
            type="button"
            disabled={privacyMode || regionModels.length === 0}
            onClick={handleArmDeploy}
            className={clsx(
              'px-2 py-0.5 rounded-full border text-xs cursor-pointer transition-colors',
              privacyMode || regionModels.length === 0
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'
                : 'border-cyan-500 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-200 dark:hover:bg-cyan-900/30'
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
              'flex max-w-full flex-wrap items-center gap-1 whitespace-nowrap rounded-lg border p-1 text-xs',
              privacyMode
                ? 'border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'
                : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
            )}
          >
            <span className="shrink-0 px-1 text-current/80">
              {t('regions.azureCliDeployCode')}
            </span>
            <button
              type="button"
              disabled={privacyMode || selectedAzureCliModels.length === 0}
              aria-label={`${t('regions.azureCliDeployCode')} ${t(
                'regions.azureCliDeploySelected'
              )}`}
              onClick={() => handleAzureCliDeployCode('selected')}
              className={clsx(
                'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                privacyMode || selectedAzureCliModels.length === 0
                  ? 'cursor-not-allowed text-gray-500'
                  : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              )}
            >
              {t('regions.azureCliDeploySelected')}
            </button>
            <button
              type="button"
              disabled={privacyMode || allMasterAzureCliModels.length === 0}
              aria-label={`${t('regions.azureCliDeployCode')} ${t(
                'regions.azureCliDeployAll'
              )}`}
              onClick={() => handleAzureCliDeployCode('all')}
              className={clsx(
                'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                privacyMode || allMasterAzureCliModels.length === 0
                  ? 'cursor-not-allowed text-gray-500'
                  : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              )}
            >
              {t('regions.azureCliDeployAll')}
            </button>
            <button
              type="button"
              disabled={privacyMode || selectedAzureCliModels.length === 0}
              aria-label={`${t('regions.azureCliDeployPowerShellCode')} ${t(
                'regions.azureCliDeploySelected'
              )}`}
              onClick={() => handleAzureCliDeployCode('selected', 'powershell')}
              className={clsx(
                'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                privacyMode || selectedAzureCliModels.length === 0
                  ? 'cursor-not-allowed text-gray-500'
                  : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              )}
            >
              PS {t('regions.azureCliDeploySelected')}
            </button>
            <button
              type="button"
              disabled={privacyMode || allMasterAzureCliModels.length === 0}
              aria-label={`${t('regions.azureCliDeployPowerShellCode')} ${t(
                'regions.azureCliDeployAll'
              )}`}
              onClick={() => handleAzureCliDeployCode('all', 'powershell')}
              className={clsx(
                'shrink-0 rounded-md px-1.5 py-0.5 transition-colors',
                privacyMode || allMasterAzureCliModels.length === 0
                  ? 'cursor-not-allowed text-gray-500'
                  : 'cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              )}
            >
              PS {t('regions.azureCliDeployAll')}
            </button>
          </div>
          <button
            type="button"
            disabled={privacyMode}
            onClick={() => handleAzureCliDeployCommand('bash')}
            className={clsx(
              'px-2 py-0.5 rounded-full border text-xs cursor-pointer transition-colors',
              privacyMode
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'
                : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/30'
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
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-500'
                : 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/30'
            )}
          >
            {t('regions.azureCliDeployPowerShellCommand')}
          </button>
        </div>
      </div>

      {!deployCollapsed && (
        <div className="mt-2 space-y-2">
          <div className="overflow-x-auto overscroll-x-contain rounded-md border border-border">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
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
                  <th className="py-2 px-3">{t('regions.deployVersion')}</th>
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
                    className="border-b border-border/60"
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
                        className="w-full rounded-lg border border-border bg-background p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        value={row.deploymentName}
                        onChange={(e) => {
                          const deploymentName = e.target.value;
                          const patch: Partial<RegionDeploymentModelConfig> = {
                            deploymentName,
                          };
                          const templateMatch = templateByDeploymentNameMap.get(
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
                        className="w-full rounded-lg border border-border bg-background p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="w-full rounded-lg border border-border bg-background p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="w-full rounded-lg border border-border bg-background p-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
  );
}
