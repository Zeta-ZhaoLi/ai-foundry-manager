import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSeries } from '../utils/modelSeries';

export interface LocalRegion {
  id: string;
  name: string;
  modelsText: string;
}

export interface LocalAccount {
  id: string;
  name: string;
  note?: string;
  enabled: boolean;
  regions: LocalRegion[];
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

function parseModels(text: string): string[] {
  if (!text) return [];
  const parts = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

export function useLocalAzureAccounts() {
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);

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
          setAccounts(normalized);
          return;
        }
      }
    } catch {
      // ignore parse errors
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
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {
      // ignore
    }
  }, []);

  const saveAccounts = useCallback(
    (updater: (prev: LocalAccount[]) => LocalAccount[]) => {
      setAccounts((prev) => {
        const next = updater(prev);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore quota errors
        }
        return next;
      });
    },
    [],
  );

  const addAccount = useCallback(() => {
    const id = `acct_${Date.now().toString(36)}`;
    const newAccount: LocalAccount = {
      id,
      name: '新账号',
      note: '',
      enabled: true,
      regions: [],
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

  const deleteAccount = useCallback(
    (id: string) => {
      saveAccounts((prev) => prev.filter((acct) => acct.id !== id));
    },
    [saveAccounts],
  );

  const addRegion = useCallback(
    (accountId: string) => {
      const regionId = `reg_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const region: LocalRegion = {
        id: regionId,
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

  // 仅统计 enabled 的账号
  const enabledAccounts = useMemo(
    () => accounts.filter((a) => a.enabled !== false),
    [accounts],
  );

  const accountSummaries: AccountSummary[] = useMemo(() => {
    return enabledAccounts.map((acct) => {
      const regions: AccountSummary['regions'] = {};
      const allModelsSet = new Set<string>();

      for (const reg of acct.regions) {
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
    deleteAccount,
    addRegion,
    updateRegionName,
    updateRegionModelsText,
    deleteRegion,
  };
}

