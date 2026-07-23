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
import { decryptLegacyData } from '../utils/encryption';
import { generateAccountId } from '../utils/accountIdGenerator';
import { generateId } from '../utils/common';

export const ACCOUNTS_STORAGE_KEY = 'ai-foundry-manager:accounts';
export const LEGACY_ACCOUNTS_STORAGE_KEY = 'azure-openai-manager:accounts';
export const LEGACY_ACCOUNTS_BACKUP_KEY =
  'ai-foundry-manager:accounts:legacy-backup';
export const DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY =
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
      available: false,
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
    available: value.available === true,
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

function normalizeDefaultTemplate(
  value: unknown
): DefaultRegionModelTemplateConfig {
  const result = defaultRegionModelTemplateConfigSchema.safeParse(value);
  return result.success
    ? result.data
    : createDefaultRegionModelTemplateConfig();
}

function readJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`${label} is not valid JSON`, { cause: error });
  }
}

export function loadAccounts(storage: Storage): LocalAccount[] {
  const currentRaw = storage.getItem(ACCOUNTS_STORAGE_KEY);
  const legacyRaw = storage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY);
  const backupRaw = storage.getItem(LEGACY_ACCOUNTS_BACKUP_KEY);
  const raw = currentRaw ?? legacyRaw ?? backupRaw;

  if (raw === null) return createInitialAccounts();
  const accounts = normalizeAccounts(readJson(raw, 'Stored accounts'));
  const normalizedRaw = serializeAccounts(accounts);

  if (currentRaw === null || normalizedRaw !== raw) {
    storage.setItem(ACCOUNTS_STORAGE_KEY, normalizedRaw);
  }
  return accounts;
}

export function serializeAccounts(accounts: LocalAccount[]): string {
  return JSON.stringify(accounts);
}

export function loadDefaultRegionModelTemplate(
  storage: Storage
): DefaultRegionModelTemplateConfig {
  const raw = storage.getItem(DEFAULT_REGION_MODEL_TEMPLATE_STORAGE_KEY);
  return raw
    ? normalizeDefaultTemplate(readJson(raw, 'Default region template'))
    : createDefaultRegionModelTemplateConfig();
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
  if (envelopeResult.success) {
    return {
      ...envelopeResult.data.data,
      accounts: normalizeAccounts(envelopeResult.data.data.accounts),
    };
  }

  const directResult = configDataV2Schema.safeParse(value);
  if (directResult.success) {
    return {
      ...directResult.data,
      accounts: normalizeAccounts(directResult.data.accounts),
    };
  }

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
