import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { getSeries } from '../utils/modelSeries';
import { parseModels, debounce, generateId } from '../utils/common';
import { encryptData, decryptData } from '../utils/encryption';

export interface LocalRegion {
  id: string;
  name: string;
  modelsText: string;
  openaiEndpoint?: string;
  anthropicEndpoint?: string;
  apiKey?: string;
  enabled?: boolean;  // 默认 true，控制是否参与统计
}

export type AccountTier = 'premium' | 'standard';
export type AccountQuota = '200' | '1000' | '2000' | '5000' | '20000' | '25000' | '45000' | 'custom';
export type CurrencyType = 'USD' | 'CNY';

export interface LocalAccount {
  id: string;
  name: string;
  note?: string;
  enabled: boolean;
  regions: LocalRegion[];
  tier?: AccountTier;       // 账号类别（高级/普通）
  quota?: AccountQuota;     // 额度选项
  customQuota?: number;     // 自定义额度值
  purchaseAmount?: number;      // 购买金额
  purchaseCurrency?: CurrencyType;  // 货币类型 (默认 USD)
  usedAmount?: number;          // 已使用额度
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

const STORAGE_KEY = 'azure-openai-manager:accounts';

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalAccount[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 兼容历史数据：如果没有 enabled 字段，默认视为启用
          const normalized = parsed.map((acct) => ({
            enabled: acct.enabled !== false,
            ...acct,
          }));
          const decrypted = decryptAccounts(normalized);
          setAccounts(decrypted);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }

    const initial: LocalAccount[] = [
      {
        id: 'sample-account',
        name: '示例账号',
        note: '你可以删除这个示例并添加自己的账号',
        enabled: true,
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
  }, [decryptAccounts]);

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
    const newAccount: LocalAccount = {
      id: generateId('acct'),
      name: '新账号',
      note: '',
      enabled: true,
      regions: [],
      quota: '2000',  // 默认额度 $2,000
    };
    saveAccounts((prev) => [...prev, newAccount]);
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

  const updateAccountTier = useCallback(
    (id: string, tier: AccountTier) => {
      saveAccounts((prev) =>
        prev.map((acct) => (acct.id === id ? { ...acct, tier } : acct)),
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
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, openaiEndpoint } : reg,
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
      saveAccounts((prev) =>
        prev.map((acct) =>
          acct.id === accountId
            ? {
                ...acct,
                regions: acct.regions.map((reg) =>
                  reg.id === regionId ? { ...reg, anthropicEndpoint } : reg,
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
    updateAccountTier,
    updateAccountQuota,
    updateAccountPurchase,
    updateAccountUsedAmount,
    deleteAccount,
    addRegion,
    updateRegionName,
    updateRegionModelsText,
    deleteRegion,
    updateRegionOpenaiEndpoint,
    updateRegionAnthropicEndpoint,
    updateRegionApiKey,
    updateRegionEnabled,
    reorderAccounts,
    reorderRegions,
  };
}
