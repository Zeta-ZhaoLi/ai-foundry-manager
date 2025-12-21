import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { getSeries } from '../utils/modelSeries';
import { parseModels, debounce, generateId, normalizeOpenAIEndpoint, normalizeAnthropicEndpoint } from '../utils/common';
import { encryptData, decryptData } from '../utils/encryption';
import { generateAccountId, regenerateAccountId, renumberAccountsByPosition } from '../utils/accountIdGenerator';

export interface LocalRegion {
  id: string;
  name: string;
  modelsText: string;
  openaiEndpoint?: string;
  anthropicEndpoint?: string;
  apiKey?: string;
  enabled?: boolean;  // 默认 true，控制是否参与统计
  openaiEndpointManualOverride?: boolean;  // OpenAI Endpoint 是否手动覆盖
  anthropicEndpointManualOverride?: boolean;  // Anthropic Endpoint 是否手动覆盖
}

export type AccountTier = 'premium' | 'standard';
export type AccountQuota = '200' | '1000' | '2000' | '5000' | '20000' | '25000' | '45000' | 'custom';
export type CurrencyType = 'USD' | 'CNY';

// 服务器凭据
export interface ServerCredentials {
  host: string;
  username: string;
  password?: string;
  sshKey?: string;
  port?: number;
  note?: string;
  serverId?: string;  // 服务器编号 (001, 002, 等)
}

export interface LocalAccount {
  id: string;
  accountId?: string;       // 账号 ID 前缀 (A001, B001 等)
  name: string;
  note?: string;
  enabled: boolean;             // 启用模型 - 模型层面统计（参与模型覆盖度计算）
  includeInStats?: boolean;     // 参与统计 - 账号层面统计（参与账号总览合计）
  regions: LocalRegion[];
  tier?: AccountTier;       // 账号类别（高级/普通）
  quota?: AccountQuota;     // 额度选项
  customQuota?: number;     // 自定义额度值
  purchaseAmount?: number;      // 购买金额
  purchaseCurrency?: CurrencyType;  // 货币类型 (默认 USD)
  usedAmount?: number;          // 已使用额度
  windowsServer?: ServerCredentials;  // Windows 服务器登录信息
  linuxServer?: ServerCredentials;    // Linux 服务器登录信息
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

export function useLocalAzureAccounts() {
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);

  // 解密敏感字段
  const decryptAccounts = useCallback((accounts: LocalAccount[]): LocalAccount[] => {
    return accounts.map((acct) => ({
      ...acct,
      regions: acct.regions.map((reg) => ({
        ...reg,
        apiKey: reg.apiKey ? decryptData(reg.apiKey) : reg.apiKey,
      })),
      windowsServer: acct.windowsServer ? {
        ...acct.windowsServer,
        password: acct.windowsServer.password ? decryptData(acct.windowsServer.password) : undefined,
      } : undefined,
      linuxServer: acct.linuxServer ? {
        ...acct.linuxServer,
        password: acct.linuxServer.password ? decryptData(acct.linuxServer.password) : undefined,
        sshKey: acct.linuxServer.sshKey ? decryptData(acct.linuxServer.sshKey) : undefined,
      } : undefined,
    }));
  }, []);

  // 加密敏感字段
  const encryptAccounts = useCallback((accounts: LocalAccount[]): LocalAccount[] => {
    return accounts.map((acct) => ({
      ...acct,
      regions: acct.regions.map((reg) => ({
        ...reg,
        apiKey: reg.apiKey ? encryptData(reg.apiKey) : reg.apiKey,
      })),
      windowsServer: acct.windowsServer ? {
        ...acct.windowsServer,
        password: acct.windowsServer.password ? encryptData(acct.windowsServer.password) : undefined,
      } : undefined,
      linuxServer: acct.linuxServer ? {
        ...acct.linuxServer,
        password: acct.linuxServer.password ? encryptData(acct.linuxServer.password) : undefined,
        sshKey: acct.linuxServer.sshKey ? encryptData(acct.linuxServer.sshKey) : undefined,
      } : undefined,
    }));
  }, []);

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

  // 迁移函数：为没有 accountId 的账号自动分配 ID
  // 使用累加器模式确保每个账号都能看到之前分配的 ID，避免重复
  const migrateAccountsToV2 = useCallback((accounts: LocalAccount[]): LocalAccount[] => {
    const migrated: LocalAccount[] = [];

    for (const acct of accounts) {
      if (!acct.accountId) {
        // 为没有 accountId 的账号生成 ID
        const tier = acct.tier || 'standard';
        // 传入 migrated 数组，包含之前已分配的 ID，确保生成唯一的序号
        const accountId = generateAccountId(migrated, tier);
        migrated.push({ ...acct, accountId });
      } else {
        // 保留已有 ID 的账号不变
        migrated.push(acct);
      }
    }

    return migrated;
  }, []);

  // 迁移函数：将 serverName 转换为 serverId
  const migrateServerNamesToIds = useCallback((accounts: LocalAccount[]): LocalAccount[] => {
    return accounts.map(acct => {
      let windowsServer = acct.windowsServer;
      let linuxServer = acct.linuxServer;

      // 迁移 Windows 服务器
      if (windowsServer?.serverName && !windowsServer.serverId) {
        // 提取末尾数字 (例如: "Server-01" → "01")
        const match = windowsServer.serverName.match(/(\d+)$/);
        const serverId = match ? match[1].padStart(3, '0') : '001';
        windowsServer = { ...windowsServer, serverId };
        delete (windowsServer as any).serverName;
      }

      // 迁移 Linux 服务器
      if (linuxServer?.serverName && !linuxServer.serverId) {
        const match = linuxServer.serverName.match(/(\d+)$/);
        const serverId = match ? match[1].padStart(3, '0') : '001';
        linuxServer = { ...linuxServer, serverId };
        delete (linuxServer as any).serverName;
      }

      return { ...acct, windowsServer, linuxServer };
    });
  }, []);

  useEffect(() => {
    try {
      // 尝试从新 key 读取数据
      let raw = window.localStorage.getItem(STORAGE_KEY);

      // 如果新 key 没有数据，尝试从旧 key 迁移
      if (!raw) {
        const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw) {
          console.log('[Migration] Migrating accounts from legacy key to new key');
          // 将旧数据复制到新 key
          window.localStorage.setItem(STORAGE_KEY, legacyRaw);
          raw = legacyRaw;
          console.log('[Migration] Accounts migration completed successfully');
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw) as LocalAccount[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 兼容历史数据：如果没有 enabled 字段，默认视为启用
          const normalized = parsed.map((acct) => ({
            enabled: acct.enabled !== false,
            ...acct,
          }));
          // 迁移：为没有 accountId 的账号分配 ID
          const migratedAccounts = migrateAccountsToV2(normalized);
          // 迁移：将 serverName 转换为 serverId
          const migrated = migrateServerNamesToIds(migratedAccounts);
          const decrypted = decryptAccounts(migrated);
          setAccounts(decrypted);
          // 如果发生了迁移，保存更新后的数据
          if (migrated.some(a => !parsed.find(p => p.id === a.id)?.accountId)) {
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
        accountId: 'B001',  // 示例账号默认为 standard
        name: '示例账号',
        note: '你可以删除这个示例并添加自己的账号',
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
  }, [decryptAccounts, migrateAccountsToV2, migrateServerNamesToIds]);

  const saveAccounts = useCallback(
    (updater: (prev: LocalAccount[]) => LocalAccount[]) => {
      setAccounts((prev) => {
        const next = updater(prev);
        debouncedSaveRef.current(next);
        return next;
      });
    },
    [],
  );

  const addAccount = useCallback(() => {
    saveAccounts((prev) => {
      const newTier: AccountTier = 'standard';  // 默认为普通账号
      const accountId = generateAccountId(prev, newTier);
      const newAccount: LocalAccount = {
        id: generateId('acct'),
        accountId,
        name: '新账号',
        note: '',
        enabled: true,
        includeInStats: true,  // 默认参与统计
        tier: newTier,
        regions: [
          {
            id: generateId('region'),
            name: 'eastus2',
            openaiEndpoint: '',
            anthropicEndpoint: '',
            apiKey: '',
            modelsText: '',
            enabled: true,
          },
        ],
        quota: '2000',  // 默认额度 $2,000
        purchaseCurrency: 'CNY',  // 默认货币为人民币
      };
      return [...prev, newAccount];
    });
  }, [saveAccounts]);

  const updateAccountName = useCallback(
    (id: string, name: string) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, name } : acct)),
      );
    },
    [saveAccounts],
  );

  const updateAccountNote = useCallback(
    (id: string, note: string) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, note } : acct)),
      );
    },
    [saveAccounts],
  );

  const updateAccountEnabled = useCallback(
    (id: string, enabled: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, enabled } : acct)),
      );
    },
    [saveAccounts],
  );

  const updateAccountIncludeInStats = useCallback(
    (id: string, includeInStats: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, includeInStats } : acct)),
      );
    },
    [saveAccounts],
  );

  const updateAccountTier = useCallback(
    (id: string, tier: AccountTier) => {
      saveAccounts((prev) =>
        prev.map((acct) => {
          if (acct.id === id) {
            // 如果类别改变，重新生成 accountId
            const currentAccountId = acct.accountId || '';
            const newAccountId = regenerateAccountId(prev, currentAccountId, tier);
            return { ...acct, tier, accountId: newAccountId };
          }
          return acct;
        }),
      );
    },
    [saveAccounts],
  );

  const updateAccountQuota = useCallback(
    (id: string, quota: AccountQuota, customQuota?: number) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, quota, customQuota } : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateAccountPurchase = useCallback(
    (id: string, purchaseAmount: number, purchaseCurrency: CurrencyType) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, purchaseAmount, purchaseCurrency } : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateAccountUsedAmount = useCallback(
    (id: string, usedAmount: number) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, usedAmount } : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateAccountWindowsServer = useCallback(
    (id: string, windowsServer: ServerCredentials | undefined) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, windowsServer } : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateAccountLinuxServer = useCallback(
    (id: string, linuxServer: ServerCredentials | undefined) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === id ? { ...acct, linuxServer } : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const deleteAccount = useCallback(
    (id: string) => {
      saveAccounts((prev) => prev.filter((acct) => acct.id !== id));
    },
    [saveAccounts],
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
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateRegionName = useCallback(
    (accountId: string, regionId: string, name: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, name } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateRegionModelsText = useCallback(
    (accountId: string, regionId: string, modelsText: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, modelsText } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
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
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateRegionOpenaiEndpoint = useCallback(
    (accountId: string, regionId: string, openaiEndpoint: string) => {
      // 规范化 OpenAI Endpoint（去除末尾斜杠）
      const normalized = normalizeOpenAIEndpoint(openaiEndpoint);
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, openaiEndpoint: normalized } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateRegionAnthropicEndpoint = useCallback(
    (accountId: string, regionId: string, anthropicEndpoint: string) => {
      // 规范化 Anthropic Endpoint（去除末尾的 /v1/messages 和斜杠）
      const normalized = normalizeAnthropicEndpoint(anthropicEndpoint);
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, anthropicEndpoint: normalized } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  const updateRegionApiKey = useCallback(
    (accountId: string, regionId: string, apiKey: string) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, apiKey } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  // 重新排序账号
  const reorderAccounts = useCallback(
    (oldIndex: number, newIndex: number) => {
      saveAccounts((prev) => {
        const result = Array.from(prev);
        const [removed] = result.splice(oldIndex, 1);
        result.splice(newIndex, 0, removed);
        return result;
      });
    },
    [saveAccounts],
  );

  // 重新排序区域
  const reorderRegions = useCallback(
    (accountId: string, oldIndex: number, newIndex: number) => {
      saveAccounts((prev) =>
        prev.map((acct) => {
          if (acct.id !== accountId) return acct;
          const regions = Array.from(acct.regions);
          const [removed] = regions.splice(oldIndex, 1);
          regions.splice(newIndex, 0, removed);
          return { ...acct, regions };
        }),
      );
    },
    [saveAccounts],
  );

  // 更新区域启用状态
  const updateRegionEnabled = useCallback(
    (accountId: string, regionId: string, enabled: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, enabled } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  // 更新 OpenAI Endpoint 手动覆盖标志
  const updateRegionOpenaiEndpointManualOverride = useCallback(
    (accountId: string, regionId: string, override: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, openaiEndpointManualOverride: override } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  // 更新 Anthropic Endpoint 手动覆盖标志
  const updateRegionAnthropicEndpointManualOverride = useCallback(
    (accountId: string, regionId: string, override: boolean) => {
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, anthropicEndpointManualOverride: override } : reg,
                ),
              }
            : acct,
        ),
      );
    },
    [saveAccounts],
  );

  // 重新编号所有账号（根据当前排序）
  const renumberAllAccounts = useCallback(() => {
    saveAccounts((prev) => {
      return renumberAccountsByPosition(prev) as LocalAccount[];
    });
  }, [saveAccounts]);

  // 导入配置
  const importConfig = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);

      // 验证配置结构
      if (!Array.isArray(parsed)) {
        return { success: false, error: 'Invalid config format: must be an array' };
      }

      // 验证每个账号的基本结构
      for (const item of parsed) {
        if (!item.id || !Array.isArray(item.regions)) {
          return { success: false, error: 'Invalid account structure' };
        }
      }

      // 解密敏感字段
      const decrypted = decryptAccounts(parsed);

      // 保存到 localStorage
      saveAccounts(() => decrypted);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [saveAccounts, decryptAccounts]);

  // 仅统计 enabled 的账号
  const enabledAccounts = useMemo(
    () => accounts.filter((a) => a.enabled !== false),
    [accounts],
  );

  const accountSummaries: AccountSummary[] = useMemo(() => {
    return enabledAccounts.map((acct) => {
      const regions: AccountSummary['regions'] = {};
      const allModelsSet = new Set<string>();

      // 只统计启用的区域
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
    accountSummaries,
    globalSeriesSummary,
    addAccount,
    updateAccountName,
    updateAccountNote,
    updateAccountEnabled,
    updateAccountIncludeInStats,
    updateAccountTier,
    updateAccountQuota,
    updateAccountPurchase,
    updateAccountUsedAmount,
    updateAccountWindowsServer,
    updateAccountLinuxServer,
    deleteAccount,
    addRegion,
    updateRegionName,
    updateRegionModelsText,
    deleteRegion,
    updateRegionOpenaiEndpoint,
    updateRegionAnthropicEndpoint,
    updateRegionApiKey,
    updateRegionEnabled,
    updateRegionOpenaiEndpointManualOverride,
    updateRegionAnthropicEndpointManualOverride,
    reorderAccounts,
    reorderRegions,
    renumberAllAccounts,
    importConfig,
  };
}
