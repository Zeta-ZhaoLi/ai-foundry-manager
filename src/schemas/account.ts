import { z } from 'zod';

// 区域配置验证
export const regionSchema = z.object({
  id: z.string().min(1, 'Region ID is required'),
  name: z.string().min(1, 'Region name is required'),
  modelsText: z.string(),
  endpoint: z
    .string()
    .url('Invalid URL format')
    .refine(
      (url) => url.includes('openai.azure.com') || url.includes('azure'),
      'Must be a valid Azure OpenAI endpoint'
    )
    .optional()
    .or(z.literal('')),
  apiKey: z
    .string()
    .min(32, 'API Key must be at least 32 characters')
    .optional()
    .or(z.literal('')),
});

// 账号配置验证
export const accountSchema = z.object({
  id: z.string().min(1, 'Account ID is required'),
  name: z.string().min(1, 'Account name is required'),
  note: z.string().optional(),
  enabled: z.boolean().default(true),
  regions: z.array(regionSchema).default([]),
});

// 配置导入验证
export const configImportSchema = z.object({
  accounts: z.array(accountSchema),
  masterText: z.string().optional(),
});

export type Region = z.infer<typeof regionSchema>;
export type Account = z.infer<typeof accountSchema>;
export type ConfigImport = z.infer<typeof configImportSchema>;
