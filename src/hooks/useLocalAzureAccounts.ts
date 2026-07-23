import { useCallback, useMemo, useRef, useState } from 'react';
import i18n from '../i18n';
import {
  generateId,
  debounce,
  type GeneratedRegionIdentityBundle,
  normalizeAiServicesEndpoint,
  normalizeFoundryProjectEndpoint,
  normalizeOpenAIEndpoint,
  normalizeAnthropicEndpoint,
} from '../utils/common';
import {
  generateAccountId,
  regenerateAccountId,
  renumberAccountsByPosition,
} from '../utils/accountIdGenerator';
import {
  defaultRegionModelTemplateConfigSchema,
  type AccountQuota,
  type AccountTier,
  type CurrencyType,
  type DefaultRegionModelTemplateConfig,
  type LocalAccount,
  type LocalRegion,
  type RegionDeploymentConfig,
  type RegionDeploymentModelConfig,
  type RegionInputSource,
  type RegionInputSources,
  type ServicePrincipalCredential,
} from '../schemas/account';
import {
  ACCOUNTS_STORAGE_KEY,
  DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY,
  createDefaultRegionModelTemplateConfig,
  createInitialAccounts,
  loadAccounts,
  loadDefaultRegionModelTemplate,
  parseConfigImport,
  serializeAccounts,
} from '../persistence/config';
import {
  loadInitialMasterModelsText,
  MASTER_MODELS_STORAGE_KEY,
} from '../utils/masterModelsStorage';
import {
  applyDeploymentResultImport,
  type DeploymentResultImportSummary,
} from '../persistence/deploymentResultImport';
import {
  selectAccountSummaries,
  selectGlobalSeriesSummary,
} from '../selectors/accountSelectors';

export type { GeneratedRegionIdentityBundle } from '../utils/common';
export type {
  AccountQuota,
  AccountTier,
  CurrencyType,
  DefaultRegionModelTemplate,
  DefaultRegionModelTemplateConfig,
  LocalAccount,
  LocalRegion,
  RegionDeploymentConfig,
  RegionDeploymentModelConfig,
  RegionInputSource,
  RegionInputSources,
  ServicePrincipalCredential,
} from '../schemas/account';
export { createDefaultRegionModelTemplateConfig } from '../persistence/config';

export type { DeploymentResultImportSummary } from '../persistence/deploymentResultImport';
export type {
  AccountSummary,
  GlobalSeriesSummary,
  SeriesSummary,
} from '../selectors/accountSelectors';

function normalizeDefaultRegionModelTemplateConfig(
  value: unknown
): DefaultRegionModelTemplateConfig {
  const parsed = defaultRegionModelTemplateConfigSchema.safeParse(value);
  return parsed.success
    ? parsed.data
    : createDefaultRegionModelTemplateConfig();
}

function createDefaultAccountRegion(
  name: string,
  modelsText = '',
  enabled = true
): LocalRegion {
  return {
    id: generateId('region'),
    name,
    openaiEndpoint: '',
    anthropicEndpoint: '',
    apiKey: '',
    modelsText,
    enabled,
  };
}

function markRegionInputSource(
  reg: LocalRegion,
  key: keyof RegionInputSources,
  source: RegionInputSource
): LocalRegion {
  return {
    ...reg,
    inputSources: {
      ...reg.inputSources,
      [key]: source,
    },
  };
}

export function useLocalAzureAccounts() {
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => {
    if (typeof window === 'undefined') return createInitialAccounts();
    try {
      return loadAccounts(window.localStorage);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      return createInitialAccounts();
    }
  });
  const [defaultRegionModelTemplate, setDefaultRegionModelTemplate] =
    useState<DefaultRegionModelTemplateConfig>(() => {
      if (typeof window === 'undefined') {
        return createDefaultRegionModelTemplateConfig();
      }
      try {
        return loadDefaultRegionModelTemplate(window.localStorage);
      } catch (error) {
        console.error('Failed to load default region template:', error);
        return createDefaultRegionModelTemplateConfig();
      }
    });
  const [masterText, setMasterText] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return loadInitialMasterModelsText(window.localStorage).text;
    } catch (error) {
      console.error('Failed to load master model directory:', error);
      return '';
    }
  });

  const debouncedSaveAccountsRef = useRef(
    debounce((nextAccounts: LocalAccount[]) => {
      try {
        window.localStorage.setItem(
          ACCOUNTS_STORAGE_KEY,
          serializeAccounts(nextAccounts)
        );
      } catch (error) {
        console.error('Failed to save accounts:', error);
      }
    }, 500)
  );
  const debouncedSaveTemplateRef = useRef(
    debounce((template: DefaultRegionModelTemplateConfig) => {
      try {
        window.localStorage.setItem(
          DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY,
          JSON.stringify(template)
        );
      } catch (error) {
        console.error('Failed to save default region template:', error);
      }
    }, 500)
  );

  const saveAccounts = useCallback(
    (updater: (prev: LocalAccount[]) => LocalAccount[]) => {
      setAccounts((current) => {
        const next = updater(current);
        debouncedSaveAccountsRef.current(next);
        return next;
      });
    },
    []
  );

  const saveDefaultRegionModelTemplate = useCallback(
    (
      updater: (
        prev: DefaultRegionModelTemplateConfig
      ) => DefaultRegionModelTemplateConfig
    ) => {
      setDefaultRegionModelTemplate((current) => {
        const next = normalizeDefaultRegionModelTemplateConfig(
          updater(current)
        );
        debouncedSaveTemplateRef.current(next);
        return next;
      });
    },
    []
  );

  const addAccount = useCallback(() => {
    saveAccounts((prev) => {
      const newTier: AccountTier = 'standard';
      const accountId = generateAccountId(prev, newTier);
      const newAccount: LocalAccount = {
        id: generateId('acct'),
        accountId,
        name: `${i18n.t('accounts.account')} ${prev.length + 1}`,
        subscriptionId: '',
        note: '',
        available: false,
        enabled: false,
        includeInStats: true,
        tier: newTier,
        regions: defaultRegionModelTemplate.regions.map((templateRegion) =>
          createDefaultAccountRegion(
            templateRegion.name,
            defaultRegionModelTemplate.enabled ? templateRegion.modelsText : '',
            templateRegion.enabled !== false
          )
        ),
        quota: '1000',
        purchaseCurrency: 'CNY',
      };
      return [...prev, newAccount];
    });
  }, [defaultRegionModelTemplate, saveAccounts]);

  const updateAccountName = useCallback(
    (id: string, name: string) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, name } : acct))
      );
    },
    [saveAccounts]
  );

  const updateAccountNote = useCallback(
    (id: string, note: string) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, note } : acct))
      );
    },
    [saveAccounts]
  );

  const updateAccountSubscriptionId = useCallback(
    (id: string, subscriptionId: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, subscriptionId } : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateAccountResourceGroupName = useCallback(
    (id: string, resourceGroupName: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, resourceGroupName } : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateAccountServicePrincipal = useCallback(
    (id: string, servicePrincipal?: ServicePrincipalCredential) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, servicePrincipal } : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateAccountEnabled = useCallback(
    (id: string, enabled: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, enabled } : acct))
      );
    },
    [saveAccounts]
  );

  const updateAccountIncludeInStats = useCallback(
    (id: string, includeInStats: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, includeInStats } : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateAccountAvailable = useCallback(
    (id: string, available: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, available } : acct))
      );
    },
    [saveAccounts]
  );

  const updateAccountTier = useCallback(
    (id: string, tier: AccountTier) => {
      saveAccounts((prev) =>
        prev.map((acct) => {
          if (acct.id === id) {
            // Regenerate account ID when the account tier changes.
            const currentAccountId = acct.accountId || '';
            const newAccountId = regenerateAccountId(
              prev,
              currentAccountId,
              tier
            );
            return { ...acct, tier, accountId: newAccountId };
          }
          return acct;
        })
      );
    },
    [saveAccounts]
  );

  const updateAccountQuota = useCallback(
    (id: string, quota: AccountQuota, customQuota?: number) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, quota, customQuota } : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateAccountPurchase = useCallback(
    (id: string, purchaseAmount: number, purchaseCurrency: CurrencyType) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, purchaseAmount, purchaseCurrency } : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateAccountUsedAmount = useCallback(
    (id: string, usedAmount: number) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, usedAmount } : acct))
      );
    },
    [saveAccounts]
  );

  const updateDefaultRegionModelTemplateEnabled = useCallback(
    (enabled: boolean) => {
      saveDefaultRegionModelTemplate((prev) => ({ ...prev, enabled }));
    },
    [saveDefaultRegionModelTemplate]
  );

  const addDefaultRegionModelTemplateRegion = useCallback(() => {
    saveDefaultRegionModelTemplate((prev) => ({
      ...prev,
      regions: [
        ...prev.regions,
        {
          id: generateId('template-region'),
          name: 'new-region',
          modelsText: '',
          enabled: true,
        },
      ],
    }));
  }, [saveDefaultRegionModelTemplate]);

  const deleteDefaultRegionModelTemplateRegion = useCallback(
    (regionId: string) => {
      saveDefaultRegionModelTemplate((prev) => ({
        ...prev,
        regions: prev.regions.filter((region) => region.id !== regionId),
      }));
    },
    [saveDefaultRegionModelTemplate]
  );

  const updateDefaultRegionModelTemplateRegionName = useCallback(
    (regionId: string, name: string) => {
      saveDefaultRegionModelTemplate((prev) => ({
        ...prev,
        regions: prev.regions.map((region) =>
          region.id === regionId ? { ...region, name } : region
        ),
      }));
    },
    [saveDefaultRegionModelTemplate]
  );

  const updateDefaultRegionModelTemplateRegionModelsText = useCallback(
    (regionId: string, modelsText: string) => {
      saveDefaultRegionModelTemplate((prev) => ({
        ...prev,
        regions: prev.regions.map((region) =>
          region.id === regionId ? { ...region, modelsText } : region
        ),
      }));
    },
    [saveDefaultRegionModelTemplate]
  );

  const updateDefaultRegionModelTemplateRegionEnabled = useCallback(
    (regionId: string, enabled: boolean) => {
      saveDefaultRegionModelTemplate((prev) => ({
        ...prev,
        regions: prev.regions.map((region) =>
          region.id === regionId ? { ...region, enabled } : region
        ),
      }));
    },
    [saveDefaultRegionModelTemplate]
  );

  const reorderDefaultRegionModelTemplateRegions = useCallback(
    (oldIndex: number, newIndex: number) => {
      saveDefaultRegionModelTemplate((prev) => {
        const regions = Array.from(prev.regions);
        const [removed] = regions.splice(oldIndex, 1);
        if (!removed) return prev;
        regions.splice(newIndex, 0, removed);
        return { ...prev, regions };
      });
    },
    [saveDefaultRegionModelTemplate]
  );

  const importDefaultRegionModelTemplate = useCallback(
    (template: unknown) => {
      const normalized = normalizeDefaultRegionModelTemplateConfig(template);
      saveDefaultRegionModelTemplate(() => normalized);
    },
    [saveDefaultRegionModelTemplate]
  );

  const updateMasterText = useCallback((nextMasterText: string) => {
    setMasterText(nextMasterText);
    try {
      window.localStorage.setItem(MASTER_MODELS_STORAGE_KEY, nextMasterText);
    } catch (error) {
      console.error('Failed to save master model directory:', error);
    }
  }, []);

  const deleteAccount = useCallback(
    (id: string) => {
      saveAccounts((prev) => prev.filter((acct) => acct.id !== id));
    },
    [saveAccounts]
  );

  const addRegion = useCallback(
    (accountId: string) => {
      const region: LocalRegion = {
        id: generateId('reg'),
        name: 'new-region',
        modelsText: '',
      };
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? { ...acct, regions: [...acct.regions, region] }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionName = useCallback(
    (accountId: string, regionId: string, name: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, name } : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionModelsText = useCallback(
    (accountId: string, regionId: string, modelsText: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, modelsText } : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const deleteRegion = useCallback(
    (accountId: string, regionId: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.filter((reg) => reg.id !== regionId),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionOpenaiEndpoint = useCallback(
    (accountId: string, regionId: string, openaiEndpoint: string) => {
      // Normalize OpenAI endpoint.
      const normalized = normalizeOpenAIEndpoint(openaiEndpoint);
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId
                    ? markRegionInputSource(
                        { ...reg, openaiEndpoint: normalized },
                        'openaiEndpoint',
                        'manual'
                      )
                    : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionFoundryProjectEndpoint = useCallback(
    (accountId: string, regionId: string, foundryProjectEndpoint: string) => {
      const normalized = normalizeFoundryProjectEndpoint(
        foundryProjectEndpoint
      );
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId
                    ? markRegionInputSource(
                        { ...reg, foundryProjectEndpoint: normalized },
                        'foundryProjectEndpoint',
                        'manual'
                      )
                    : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionAiServicesEndpoint = useCallback(
    (accountId: string, regionId: string, aiServicesEndpoint: string) => {
      const normalized = normalizeAiServicesEndpoint(aiServicesEndpoint);
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId
                    ? markRegionInputSource(
                        { ...reg, aiServicesEndpoint: normalized },
                        'aiServicesEndpoint',
                        'manual'
                      )
                    : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionAnthropicEndpoint = useCallback(
    (accountId: string, regionId: string, anthropicEndpoint: string) => {
      // Normalize Anthropic endpoint.
      const normalized = normalizeAnthropicEndpoint(anthropicEndpoint);
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId
                    ? markRegionInputSource(
                        { ...reg, anthropicEndpoint: normalized },
                        'anthropicEndpoint',
                        'manual'
                      )
                    : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionApiKey = useCallback(
    (accountId: string, regionId: string, apiKey: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, apiKey } : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const updateRegionDeployment = useCallback(
    (
      accountId: string,
      regionId: string,
      patch: Partial<RegionDeploymentConfig>
    ) => {
      saveAccounts((prev) =>
        prev.map((acct) => {
          if (acct.id !== accountId) return acct;
          return {
            ...acct,
            regions: acct.regions.map((reg) =>
              reg.id === regionId
                ? {
                    ...(Object.prototype.hasOwnProperty.call(
                      patch,
                      'resourceName'
                    )
                      ? markRegionInputSource(reg, 'resourceName', 'manual')
                      : reg),
                    deployment: {
                      ...reg.deployment,
                      ...patch,
                    },
                  }
                : reg
            ),
          };
        })
      );
    },
    [saveAccounts]
  );

  const applyGeneratedRegionIdentity = useCallback(
    (
      accountId: string,
      regionId: string,
      bundle: GeneratedRegionIdentityBundle
    ) => {
      saveAccounts((prev) =>
        prev.map((acct) => {
          if (acct.id !== accountId) return acct;
          return {
            ...acct,
            regions: acct.regions.map((reg) =>
              reg.id === regionId
                ? {
                    ...reg,
                    foundryProjectEndpoint: bundle.foundryProjectEndpoint,
                    openaiEndpoint: bundle.openaiEndpoint,
                    aiServicesEndpoint: bundle.aiServicesEndpoint,
                    anthropicEndpoint: bundle.anthropicEndpoint,
                    deployment: {
                      ...reg.deployment,
                      resourceName: bundle.resourceName,
                    },
                    inputSources: {
                      ...reg.inputSources,
                      resourceName: 'generated',
                      foundryProjectEndpoint: 'generated',
                      openaiEndpoint: 'generated',
                      aiServicesEndpoint: 'generated',
                      anthropicEndpoint: 'generated',
                    },
                  }
                : reg
            ),
          };
        })
      );
    },
    [saveAccounts]
  );

  const updateRegionDeploymentModel = useCallback(
    (
      accountId: string,
      regionId: string,
      modelName: string,
      patch: Partial<RegionDeploymentModelConfig>
    ) => {
      saveAccounts((prev) =>
        prev.map((acct) => {
          if (acct.id !== accountId) return acct;
          return {
            ...acct,
            regions: acct.regions.map((reg) => {
              if (reg.id !== regionId) return reg;
              const current = reg.deployment?.models || {};
              const nextModels = {
                ...current,
                [modelName]: {
                  ...current[modelName],
                  ...patch,
                },
              };
              return {
                ...reg,
                deployment: {
                  ...reg.deployment,
                  models: nextModels,
                },
              };
            }),
          };
        })
      );
    },
    [saveAccounts]
  );

  // Reorder accounts.
  const reorderAccounts = useCallback(
    (oldIndex: number, newIndex: number) => {
      saveAccounts((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(oldIndex, 1);
        result.splice(newIndex, 0, removed);
        return result;
      });
    },
    [saveAccounts]
  );

  // Reorder regions.
  const reorderRegions = useCallback(
    (accountId: string, oldIndex: number, newIndex: number) => {
      saveAccounts((prev) =>
        prev.map((acct) => {
          if (acct.id !== accountId) return acct;
          const regions = Array.from(acct.regions);
          const [removed] = regions.splice(oldIndex, 1);
          regions.splice(newIndex, 0, removed);
          return { ...acct, regions };
        })
      );
    },
    [saveAccounts]
  );

  const updateRegionEnabled = useCallback(
    (accountId: string, regionId: string, enabled: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, enabled } : reg
                ),
              }
            : acct
        )
      );
    },
    [saveAccounts]
  );

  const renumberAllAccounts = useCallback(() => {
    saveAccounts((prev) => {
      return renumberAccountsByPosition(prev) as LocalAccount[];
    });
  }, [saveAccounts]);

  // Import configuration.
  const importConfig = useCallback(
    (jsonString: string): { success: boolean; error?: string } => {
      try {
        const parsed = JSON.parse(jsonString) as unknown;
        const next = parseConfigImport(parsed, {
          version: 2,
          accounts,
          masterText,
          defaultRegionModelTemplate,
        });
        setAccounts(next.accounts);
        setMasterText(next.masterText);
        setDefaultRegionModelTemplate(next.defaultRegionModelTemplate);
        window.localStorage.setItem(
          ACCOUNTS_STORAGE_KEY,
          serializeAccounts(next.accounts)
        );
        window.localStorage.setItem(MASTER_MODELS_STORAGE_KEY, next.masterText);
        window.localStorage.setItem(
          DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY,
          JSON.stringify(next.defaultRegionModelTemplate)
        );
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [accounts, defaultRegionModelTemplate, masterText]
  );

  const importDeploymentResultText = useCallback(
    (text: string): DeploymentResultImportSummary => {
      const result = applyDeploymentResultImport(accounts, text);
      if (result.accounts) {
        saveAccounts(() => result.accounts!);
      }
      return result.summary;
    },
    [accounts, saveAccounts]
  );

  const accountSummaries = useMemo(
    () => selectAccountSummaries(accounts),
    [accounts]
  );
  const globalSeriesSummary = useMemo(
    () => selectGlobalSeriesSummary(accountSummaries),
    [accountSummaries]
  );

  return {
    accounts,
    masterText,
    updateMasterText,
    defaultRegionModelTemplate,
    accountSummaries,
    globalSeriesSummary,
    addAccount,
    updateDefaultRegionModelTemplateEnabled,
    addDefaultRegionModelTemplateRegion,
    deleteDefaultRegionModelTemplateRegion,
    updateDefaultRegionModelTemplateRegionName,
    updateDefaultRegionModelTemplateRegionModelsText,
    updateDefaultRegionModelTemplateRegionEnabled,
    reorderDefaultRegionModelTemplateRegions,
    importDefaultRegionModelTemplate,
    updateAccountName,
    updateAccountSubscriptionId,
    updateAccountResourceGroupName,
    updateAccountServicePrincipal,
    updateAccountNote,
    updateAccountEnabled,
    updateAccountAvailable,
    updateAccountIncludeInStats,
    updateAccountTier,
    updateAccountQuota,
    updateAccountPurchase,
    updateAccountUsedAmount,
    deleteAccount,
    addRegion,
    updateRegionName,
    updateRegionModelsText,
    deleteRegion,
    updateRegionFoundryProjectEndpoint,
    updateRegionOpenaiEndpoint,
    updateRegionAiServicesEndpoint,
    updateRegionAnthropicEndpoint,
    updateRegionApiKey,
    updateRegionDeployment,
    applyGeneratedRegionIdentity,
    updateRegionDeploymentModel,
    updateRegionEnabled,
    reorderAccounts,
    reorderRegions,
    renumberAllAccounts,
    importConfig,
    importDeploymentResultText,
  };
}
