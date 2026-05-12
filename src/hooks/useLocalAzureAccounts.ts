import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import i18n from '../i18n';
import { getSeries } from '../utils/modelSeries';
import {
  parseModels,
  debounce,
  generateId,
  type GeneratedRegionIdentityBundle,
  normalizeAiServicesEndpoint,
  normalizeFoundryProjectEndpoint,
  normalizeOpenAIEndpoint,
  normalizeAnthropicEndpoint,
} from '../utils/common';
import { encryptData, decryptData } from '../utils/encryption';
import {
  generateAccountId,
  regenerateAccountId,
  renumberAccountsByPosition,
} from '../utils/accountIdGenerator';
import type { ServicePrincipalCredential } from '../utils/servicePrincipal';

export type { GeneratedRegionIdentityBundle } from '../utils/common';
export type { ServicePrincipalCredential } from '../utils/servicePrincipal';

export interface LocalRegion {
  id: string;
  name: string;
  modelsText: string;
  foundryProjectEndpoint?: string;
  openaiEndpoint?: string;
  aiServicesEndpoint?: string;
  anthropicEndpoint?: string;
  apiKey?: string;
  enabled?: boolean;
  deployment?: RegionDeploymentConfig;
  inputSources?: RegionInputSources;
}

export type RegionInputSource = 'generated' | 'manual';

export interface RegionInputSources {
  resourceName?: RegionInputSource;
  foundryProjectEndpoint?: RegionInputSource;
  openaiEndpoint?: RegionInputSource;
  aiServicesEndpoint?: RegionInputSource;
  anthropicEndpoint?: RegionInputSource;
}

export interface RegionDeploymentModelConfig {
  enabled?: boolean;
  deploymentName?: string;
  version?: string;
  modelFormat?: string;
  capacity?: number;
}

export interface RegionDeploymentConfig {
  /** Region-scoped Azure OpenAI resource name */
  resourceName?: string;
  /** Per-model deployment settings */
  models?: Record<string, RegionDeploymentModelConfig>;
}

export type AccountTier = 'premium' | 'standard';
export type AccountQuota =
  | '200'
  | '1000'
  | '2000'
  | '5000'
  | '20000'
  | '25000'
  | '45000'
  | 'custom';
export type CurrencyType = 'USD' | 'CNY';

export interface LocalAccount {
  id: string;
  accountId?: string;
  name: string;
  subscriptionId?: string;
  servicePrincipal?: ServicePrincipalCredential;
  note?: string;
  enabled: boolean;
  includeInStats?: boolean;
  regions: LocalRegion[];
  tier?: AccountTier;
  quota?: AccountQuota;
  customQuota?: number;
  purchaseAmount?: number;
  purchaseCurrency?: CurrencyType;
  usedAmount?: number;
}

export interface DefaultRegionModelTemplate {
  id: string;
  name: string;
  modelsText: string;
}

export interface DefaultRegionModelTemplateConfig {
  enabled: boolean;
  regions: DefaultRegionModelTemplate[];
}

export interface AccountSummary {
  accountKey: string;
  regions: {
    [regionLabel: string]: {
      models: string[];
    };
  };
  allModels: string[];
}

export interface SeriesSummary {
  [seriesName: string]: string[];
}

const STORAGE_KEY = 'ai-foundry-manager:accounts';
const LEGACY_STORAGE_KEY = 'azure-openai-manager:accounts';
const DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY =
  'ai-foundry-manager:default-region-model-template';
const DEFAULT_NEW_ACCOUNT_REGION_NAMES = [
  'eastus2',
  'swedencentral',
  'polandcentral',
];

export const createDefaultRegionModelTemplateConfig =
  (): DefaultRegionModelTemplateConfig => ({
    enabled: true,
    regions: DEFAULT_NEW_ACCOUNT_REGION_NAMES.map((name) => ({
      id: generateId('template-region'),
      name,
      modelsText: '',
    })),
  });

function normalizeDefaultRegionModelTemplateConfig(
  value: unknown
): DefaultRegionModelTemplateConfig {
  if (!value || typeof value !== 'object') {
    return createDefaultRegionModelTemplateConfig();
  }

  const raw = value as Partial<DefaultRegionModelTemplateConfig>;
  const regions = Array.isArray(raw.regions)
    ? raw.regions
        .filter((region) => Boolean(region) && typeof region === 'object')
        .map((region) => ({
          id:
            typeof region.id === 'string' && region.id.trim()
              ? region.id
              : generateId('template-region'),
          name: typeof region.name === 'string' ? region.name : '',
          modelsText:
            typeof region.modelsText === 'string' ? region.modelsText : '',
        }))
    : createDefaultRegionModelTemplateConfig().regions;

  return {
    enabled: raw.enabled !== false,
    regions,
  };
}

function createDefaultAccountRegion(
  name: string,
  modelsText = ''
): LocalRegion {
  return {
    id: generateId('region'),
    name,
    openaiEndpoint: '',
    anthropicEndpoint: '',
    apiKey: '',
    modelsText,
    enabled: true,
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
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [defaultRegionModelTemplate, setDefaultRegionModelTemplate] =
    useState<DefaultRegionModelTemplateConfig>(() => {
      if (typeof window === 'undefined') {
        return createDefaultRegionModelTemplateConfig();
      }
      try {
        const raw = window.localStorage.getItem(
          DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY
        );
        if (!raw) return createDefaultRegionModelTemplateConfig();
        return normalizeDefaultRegionModelTemplateConfig(JSON.parse(raw));
      } catch {
        return createDefaultRegionModelTemplateConfig();
      }
    });

  const decryptAccounts = useCallback(
    (accounts: LocalAccount[]): LocalAccount[] => {
      return accounts.map((acct) => {
        // Drop deprecated account-level server fields while loading.
        const {
          windowsServer: _windowsServer,
          linuxServer: _linuxServer,
          deployment: legacyAccountDeployment,
          ...rest
        } = acct as any;

        const legacyAccountResourceName =
          (legacyAccountDeployment?.resourceName as string | undefined) ||
          (typeof legacyAccountDeployment?.resourceGroup === 'string'
            ? legacyAccountDeployment.resourceGroup
            : undefined);
        const servicePrincipal = (rest as LocalAccount).servicePrincipal;

        return {
          ...(rest as LocalAccount),
          servicePrincipal: servicePrincipal
            ? {
                ...servicePrincipal,
                password: servicePrincipal.password
                  ? decryptData(servicePrincipal.password)
                  : servicePrincipal.password,
              }
            : servicePrincipal,
          regions: (acct.regions || []).map((reg) => ({
            ...reg,
            deployment: {
              ...((reg as any).deployment || {}),
              resourceName:
                (
                  (reg as any).deployment?.resourceName as string | undefined
                )?.trim() || legacyAccountResourceName,
            },
            apiKey: reg.apiKey ? decryptData(reg.apiKey) : reg.apiKey,
          })),
        };
      });
    },
    []
  );

  const encryptAccounts = useCallback(
    (accounts: LocalAccount[]): LocalAccount[] => {
      return accounts.map((acct) => {
        const {
          windowsServer: _windowsServer,
          linuxServer: _linuxServer,
          deployment: _deployment,
          ...rest
        } = acct as any;

        return {
          ...(rest as LocalAccount),
          servicePrincipal: acct.servicePrincipal
            ? {
                ...acct.servicePrincipal,
                password: acct.servicePrincipal.password
                  ? encryptData(acct.servicePrincipal.password)
                  : acct.servicePrincipal.password,
              }
            : acct.servicePrincipal,
          regions: (acct.regions || []).map((reg) => ({
            ...reg,
            apiKey: reg.apiKey ? encryptData(reg.apiKey) : reg.apiKey,
          })),
        };
      });
    },
    []
  );

  // Debounced save function
  const debouncedSaveRef = useRef(
    debounce((accounts: LocalAccount[]) => {
      try {
        const encrypted = JSON.stringify(encryptAccounts(accounts));
        window.localStorage.setItem(STORAGE_KEY, encrypted);
      } catch (error) {
        console.error('Failed to save accounts:', error);
      }
    }, 500)
  );

  const debouncedSaveDefaultRegionModelTemplateRef = useRef(
    debounce((template: DefaultRegionModelTemplateConfig) => {
      try {
        window.localStorage.setItem(
          DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY,
          JSON.stringify(template)
        );
      } catch (error) {
        console.error('Failed to save default region model template:', error);
      }
    }, 500)
  );

  // Assign account IDs to legacy entries that do not have one.
  const migrateAccountsToV2 = useCallback(
    (accounts: LocalAccount[]): LocalAccount[] => {
      const migrated: LocalAccount[] = [];

      for (const acct of accounts) {
        if (!acct.accountId) {
          // Generate an ID for legacy accounts.
          const tier = acct.tier || 'standard';
          const accountId = generateAccountId(migrated, tier);
          migrated.push({ ...acct, accountId });
        } else {
          migrated.push(acct);
        }
      }

      return migrated;
    },
    []
  );

  // Server login fields are deprecated.
  useEffect(() => {
    try {
      // Read from the current storage key first.
      let raw = window.localStorage.getItem(STORAGE_KEY);

      // Fall back to the legacy storage key.
      if (!raw) {
        const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          console.log(
            '[Migration] Migrating accounts from legacy key to new key'
          );
          // Copy legacy data into the current storage key.
          window.localStorage.setItem(STORAGE_KEY, legacyRaw);
          raw = legacyRaw;
          console.log('[Migration] Accounts migration completed successfully');
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw) as LocalAccount[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed.map((acct) => ({
            ...acct,
            enabled: acct.enabled !== false,
          }));
          const hadMissingAccountId = (parsed as any[]).some(
            (acct) => !acct?.accountId
          );
          const hadLegacyServerFields = (parsed as any[]).some(
            (acct) => acct?.windowsServer || acct?.linuxServer
          );
          const hadLegacyAccountResourceName = (parsed as any[]).some(
            (acct) => {
              const deployment = acct?.deployment;
              return Boolean(
                deployment?.resourceName || deployment?.resourceGroup
              );
            }
          );

          // Assign missing account IDs.
          const migratedAccounts = migrateAccountsToV2(normalized);
          const decrypted = decryptAccounts(migratedAccounts);
          setAccounts(decrypted);

          // Persist cleaned legacy data.
          if (
            hadMissingAccountId ||
            hadLegacyServerFields ||
            hadLegacyAccountResourceName
          ) {
            debouncedSaveRef.current(decrypted);
          }
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }

    const initial: LocalAccount[] = [
      {
        id: 'sample-account',
        accountId: 'B001',
        name: `${i18n.t('accounts.account')} 1`,
        note: '',
        enabled: true,
        tier: 'standard',
        regions: [
          {
            id: 'sample-region',
            name: 'eastus',
            modelsText: 'gpt-4o,gpt-4o-mini',
          },
        ],
      },
    ];
    setAccounts(initial);
    debouncedSaveRef.current(initial);
  }, [decryptAccounts, migrateAccountsToV2]);

  const saveAccounts = useCallback(
    (updater: (prev: LocalAccount[]) => LocalAccount[]) => {
      setAccounts((prev) => {
        const next = updater(prev);
        debouncedSaveRef.current(next);
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
      setDefaultRegionModelTemplate((prev) => {
        const next = normalizeDefaultRegionModelTemplateConfig(updater(prev));
        debouncedSaveDefaultRegionModelTemplateRef.current(next);
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
        enabled: false,
        includeInStats: true,
        tier: newTier,
        regions: defaultRegionModelTemplate.regions.map((templateRegion) =>
          createDefaultAccountRegion(
            templateRegion.name,
            defaultRegionModelTemplate.enabled
              ? templateRegion.modelsText
              : ''
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
      setDefaultRegionModelTemplate(normalized);
      debouncedSaveDefaultRegionModelTemplateRef.current(normalized);
    },
    []
  );

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
        const parsed = JSON.parse(jsonString);

        // Validate configuration shape.
        if (!Array.isArray(parsed)) {
          return {
            success: false,
            error: 'Invalid config format: must be an array',
          };
        }

        for (const item of parsed) {
          if (!item.id || !Array.isArray(item.regions)) {
            return { success: false, error: 'Invalid account structure' };
          }
        }

        // Decrypt sensitive fields and drop deprecated fields.
        const decrypted = decryptAccounts(parsed);

        // Persist imported data.
        saveAccounts(() => decrypted);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [saveAccounts, decryptAccounts]
  );

  const enabledAccounts = useMemo(
    () => accounts.filter((a) => a.enabled !== false),
    [accounts]
  );

  const accountSummaries: AccountSummary[] = useMemo(() => {
    return enabledAccounts.map((acct) => {
      const regions: AccountSummary['regions'] = {};
      const allModelsSet = new Set<string>();

      // Only include enabled regions.
      const enabledRegions = acct.regions.filter((r) => r.enabled !== false);
      for (const reg of enabledRegions) {
        const models = parseModels(reg.modelsText);
        if (!regions[reg.name]) {
          regions[reg.name] = { models: [] };
        }
        regions[reg.name].models.push(...models);
        for (const m of models) {
          allModelsSet.add(m);
        }
      }

      const normalizedRegions: AccountSummary['regions'] = {};
      Object.entries(regions).forEach(([name, info]) => {
        normalizedRegions[name] = {
          models: Array.from(new Set(info.models)).sort(),
        };
      });

      return {
        accountKey: acct.name || acct.id,
        regions: normalizedRegions,
        allModels: Array.from(allModelsSet).sort(),
      };
    });
  }, [enabledAccounts]);

  const globalSeriesSummary: { allModels: string[]; bySeries: SeriesSummary } =
    useMemo(() => {
      const allSet = new Set<string>();
      for (const acc of accountSummaries) {
        for (const m of acc.allModels) {
          allSet.add(m);
        }
      }
      const allModels = Array.from(allSet).sort();
      const bySeries: SeriesSummary = {};
      for (const m of allModels) {
        const s = getSeries(m);
        if (!bySeries[s]) bySeries[s] = [];
        bySeries[s].push(m);
      }
      return { allModels, bySeries };
    }, [accountSummaries]);

  return {
    accounts,
    defaultRegionModelTemplate,
    accountSummaries,
    globalSeriesSummary,
    addAccount,
    updateDefaultRegionModelTemplateEnabled,
    addDefaultRegionModelTemplateRegion,
    deleteDefaultRegionModelTemplateRegion,
    updateDefaultRegionModelTemplateRegionName,
    updateDefaultRegionModelTemplateRegionModelsText,
    reorderDefaultRegionModelTemplateRegions,
    importDefaultRegionModelTemplate,
    updateAccountName,
    updateAccountSubscriptionId,
    updateAccountServicePrincipal,
    updateAccountNote,
    updateAccountEnabled,
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
  };
}
