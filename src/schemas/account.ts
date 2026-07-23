import { z } from 'zod';

export const CONFIG_FORMAT = 'ai-foundry-manager-config' as const;
export const CONFIG_VERSION = 2 as const;

export const regionInputSourceSchema = z.enum(['generated', 'manual']);

export const regionInputSourcesSchema = z.object({
  resourceName: regionInputSourceSchema.optional(),
  foundryProjectEndpoint: regionInputSourceSchema.optional(),
  openaiEndpoint: regionInputSourceSchema.optional(),
  aiServicesEndpoint: regionInputSourceSchema.optional(),
  anthropicEndpoint: regionInputSourceSchema.optional(),
});

export const regionDeploymentModelConfigSchema = z.object({
  enabled: z.boolean().optional(),
  deploymentName: z.string().optional(),
  version: z.string().optional(),
  modelFormat: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

export const regionDeploymentConfigSchema = z.object({
  resourceName: z.string().optional(),
  models: z.record(z.string(), regionDeploymentModelConfigSchema).optional(),
});

export const servicePrincipalCredentialSchema = z.object({
  appId: z.string(),
  displayName: z.string().optional(),
  password: z.string().optional(),
  tenant: z.string(),
});

export const localRegionSchema = z.object({
  id: z.string().min(1, 'Region ID is required'),
  name: z.string(),
  modelsText: z.string().default(''),
  foundryProjectEndpoint: z.string().optional(),
  openaiEndpoint: z.string().optional(),
  aiServicesEndpoint: z.string().optional(),
  anthropicEndpoint: z.string().optional(),
  apiKey: z.string().optional(),
  enabled: z.boolean().optional(),
  deployment: regionDeploymentConfigSchema.optional(),
  inputSources: regionInputSourcesSchema.optional(),
});

export const accountTierSchema = z.enum(['premium', 'standard']);
export const accountQuotaSchema = z.enum([
  '200',
  '1000',
  '2000',
  '5000',
  '20000',
  '25000',
  '45000',
  'custom',
]);
export const currencyTypeSchema = z.enum(['USD', 'CNY']);

export const localAccountSchema = z.object({
  id: z.string().min(1, 'Account ID is required'),
  accountId: z.string().optional(),
  name: z.string(),
  subscriptionId: z.string().optional(),
  resourceGroupName: z.string().optional(),
  servicePrincipal: servicePrincipalCredentialSchema.optional(),
  note: z.string().optional(),
  available: z.boolean().default(false),
  enabled: z.boolean().default(true),
  includeInStats: z.boolean().optional(),
  regions: z.array(localRegionSchema).default([]),
  tier: accountTierSchema.optional(),
  quota: accountQuotaSchema.optional(),
  customQuota: z.number().finite().nonnegative().optional(),
  purchaseAmount: z.number().finite().nonnegative().optional(),
  purchaseCurrency: currencyTypeSchema.optional(),
  usedAmount: z.number().finite().nonnegative().optional(),
});

export const defaultRegionModelTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  modelsText: z.string().default(''),
  enabled: z.boolean().default(true),
});

export const defaultRegionModelTemplateConfigSchema = z.object({
  enabled: z.boolean().default(true),
  regions: z.array(defaultRegionModelTemplateSchema).default([]),
});

export const configDataV2Schema = z.object({
  version: z.literal(CONFIG_VERSION),
  accounts: z.array(localAccountSchema),
  masterText: z.string(),
  defaultRegionModelTemplate: defaultRegionModelTemplateConfigSchema,
});

export const configEnvelopeV2Schema = z.object({
  format: z.literal(CONFIG_FORMAT),
  version: z.literal(CONFIG_VERSION),
  exportedAt: z.string().datetime(),
  data: configDataV2Schema,
});

export type RegionInputSource = z.infer<typeof regionInputSourceSchema>;
export type RegionInputSources = z.infer<typeof regionInputSourcesSchema>;
export type RegionDeploymentModelConfig = z.infer<
  typeof regionDeploymentModelConfigSchema
>;
export type RegionDeploymentConfig = z.infer<
  typeof regionDeploymentConfigSchema
>;
export type ServicePrincipalCredential = z.infer<
  typeof servicePrincipalCredentialSchema
>;
export type LocalRegion = z.infer<typeof localRegionSchema>;
export type AccountTier = z.infer<typeof accountTierSchema>;
export type AccountQuota = z.infer<typeof accountQuotaSchema>;
export type CurrencyType = z.infer<typeof currencyTypeSchema>;
export type LocalAccount = z.infer<typeof localAccountSchema>;
export type DefaultRegionModelTemplate = z.infer<
  typeof defaultRegionModelTemplateSchema
>;
export type DefaultRegionModelTemplateConfig = z.infer<
  typeof defaultRegionModelTemplateConfigSchema
>;
export type ConfigDataV2 = z.infer<typeof configDataV2Schema>;
export type ConfigEnvelopeV2 = z.infer<typeof configEnvelopeV2Schema>;
