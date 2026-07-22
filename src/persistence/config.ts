import i18n from '../i18n';
import { DEFAULT_MASTER_MODEL_DIRECTORY_TEXT } from '../constants/defaultMasterModelDirectory';
import {
  CONFIG_FORMAT,
  CONFIG_VERSION,
  configDataV2Schema,
  configEnvelopeV2Schema,
  defaultRegionModelTemplateConfigSchema,
  localAccountSchema,
  localRegionSchema,
  type ConfigDataV2,
  type ConfigEnvelopeV2,
  type DefaultRegionModelTemplateConfig,
  type LocalAccount,
  type LocalRegion,
} from '../schemas/account';
import {
  LEGACY_ACCOUNTS_BACKUP_KEY,
  LEGACY_ACCOUNTS_STORAGE_KEY,
  LEGACY_ACCOUNTS_STORAGE_KEY_V1,
} from '../security/vault';
import { decryptLegacyData } from '../utils/encryption';
import {
  LEGACY_MASTER_MODELS_STORAGE_KEY,
  MASTER_MODELS_STORAGE_KEY,
} from '../utils/masterModelsStorage';
import { generateAccountId } from '../utils/accountIdGenerator';
import { generateId } from '../utils/common';

export const LEGACY_DEFAULT_TEMPLATE_STORAGE_KEY =
  'ai-foundry-manager:default-region-model-template';

const DEFAULT_REGION_NAMES = ['eastus2', 'swedencentral', 'polandcentral'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function createDefaultRegionModelTemplateConfig(): DefaultRegionModelTemplateConfig {
  return {
    enabled: true,
    regions: DEFAULT_REGION_NAMES.map((name) => ({
      id: generateId('template-region'),
      name,
      modelsText: '',
      enabled: true,
    })),
  };
}

export function createInitialAccounts(): LocalAccount[] {
  return [
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
}

export function createInitialConfigData(): ConfigDataV2 {
  return {
    version: CONFIG_VERSION,
    accounts: createInitialAccounts(),
    masterText: DEFAULT_MASTER_MODEL_DIRECTORY_TEXT,
    defaultRegionModelTemplate: createDefaultRegionModelTemplateConfig(),
  };
}

function normalizeRegion(
  value: unknown,
  legacyResourceName?: string
): LocalRegion {
  if (!isRecord(value)) {
    throw new Error('Invalid region structure');
  }
  const deployment = isRecord(value.deployment) ? value.deployment : {};
  const apiKey = optionalString(value.apiKey);
  return localRegionSchema.parse({
    ...value,
    id: optionalString(value.id) || generateId('region'),
    name: optionalString(value.name) || '',
    modelsText: optionalString(value.modelsText) || '',
    apiKey: apiKey ? decryptLegacyData(apiKey) : apiKey,
    deployment: {
      ...deployment,
      resourceName:
        optionalString(deployment.resourceName)?.trim() || legacyResourceName,
    },
  });
}

function normalizeAccount(value: unknown, prior: LocalAccount[]): LocalAccount {
  if (!isRecord(value) || !Array.isArray(value.regions)) {
    throw new Error('Invalid account structure');
  }
  const legacyDeployment = isRecord(value.deployment) ? value.deployment : {};
  const legacyResourceName =
    optionalString(legacyDeployment.resourceName) ||
    optionalString(legacyDeployment.resourceGroup);
  const servicePrincipal = isRecord(value.servicePrincipal)
    ? {
        ...value.servicePrincipal,
        password: optionalString(value.servicePrincipal.password)
          ? decryptLegacyData(String(value.servicePrincipal.password))
          : undefined,
      }
    : undefined;
  const tier = value.tier === 'premium' ? 'premium' : 'standard';
  const account = localAccountSchema.parse({
    ...value,
    id: optionalString(value.id) || generateId('acct'),
    accountId:
      optionalString(value.accountId) || generateAccountId(prior, tier),
    name: optionalString(value.name) || optionalString(value.id) || '',
    enabled: value.enabled !== false,
    tier,
    servicePrincipal,
    regions: value.regions.map((region) =>
      normalizeRegion(region, legacyResourceName)
    ),
  });
  return account;
}

export function normalizeAccounts(value: unknown): LocalAccount[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid config format: accounts must be an array');
  }
  const accounts: LocalAccount[] = [];
  for (const raw of value) accounts.push(normalizeAccount(raw, accounts));
  return accounts;
}

function normalizeDefaultTemplate(value: unknown): DefaultRegionModelTemplateConfig {
  const result = defaultRegionModelTemplateConfigSchema.safeParse(value);
  return result.success ? result.data : createDefaultRegionModelTemplateConfig();
}

function readJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
}

export interface LegacyConfigReadResult {
  data: ConfigDataV2;
  hadLegacyData: boolean;
  legacyAccountsRaw?: string;
}

export function readLegacyConfigData(storage: Storage): LegacyConfigReadResult {
  const accountsRaw =
    storage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY) ??
    storage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY_V1);
  if (accountsRaw !== null) {
    storage.setItem(LEGACY_ACCOUNTS_BACKUP_KEY, accountsRaw);
  }

  const masterText =
    storage.getItem(MASTER_MODELS_STORAGE_KEY) ??
    storage.getItem(LEGACY_MASTER_MODELS_STORAGE_KEY) ??
    DEFAULT_MASTER_MODEL_DIRECTORY_TEXT;
  const templateRaw = storage.getItem(LEGACY_DEFAULT_TEMPLATE_STORAGE_KEY);
  const defaultRegionModelTemplate = templateRaw
    ? normalizeDefaultTemplate(readJson(templateRaw, 'Default region template'))
    : createDefaultRegionModelTemplateConfig();

  const data: ConfigDataV2 = {
    version: CONFIG_VERSION,
    accounts: accountsRaw
      ? normalizeAccounts(readJson(accountsRaw, 'Legacy accounts'))
      : createInitialAccounts(),
    masterText,
    defaultRegionModelTemplate,
  };
  return {
    data: configDataV2Schema.parse(data),
    hadLegacyData: accountsRaw !== null,
    legacyAccountsRaw: accountsRaw ?? undefined,
  };
}

export function finishLegacyMigration(storage: Storage): void {
  storage.removeItem(LEGACY_ACCOUNTS_STORAGE_KEY);
  storage.removeItem(LEGACY_ACCOUNTS_STORAGE_KEY_V1);
  storage.removeItem(MASTER_MODELS_STORAGE_KEY);
  storage.removeItem(LEGACY_MASTER_MODELS_STORAGE_KEY);
  storage.removeItem(LEGACY_DEFAULT_TEMPLATE_STORAGE_KEY);
}

export function parseConfigData(value: unknown): ConfigDataV2 {
  return configDataV2Schema.parse(value);
}

export function createConfigEnvelope(data: ConfigDataV2): ConfigEnvelopeV2 {
  return {
    format: CONFIG_FORMAT,
    version: CONFIG_VERSION,
    exportedAt: new Date().toISOString(),
    data: configDataV2Schema.parse(data),
  };
}

export function parseConfigImport(
  value: unknown,
  current: ConfigDataV2
): ConfigDataV2 {
  const envelopeResult = configEnvelopeV2Schema.safeParse(value);
  if (envelopeResult.success) return envelopeResult.data.data;

  const directResult = configDataV2Schema.safeParse(value);
  if (directResult.success) return directResult.data;

  if (Array.isArray(value)) {
    return { ...current, accounts: normalizeAccounts(value) };
  }
  if (isRecord(value) && Array.isArray(value.accounts)) {
    return configDataV2Schema.parse({
      version: CONFIG_VERSION,
      accounts: normalizeAccounts(value.accounts),
      masterText:
        typeof value.masterText === 'string'
          ? value.masterText
          : current.masterText,
      defaultRegionModelTemplate:
        value.defaultRegionModelTemplate === undefined
          ? current.defaultRegionModelTemplate
          : normalizeDefaultTemplate(value.defaultRegionModelTemplate),
    });
  }
  throw new Error('Unsupported configuration format');
}
