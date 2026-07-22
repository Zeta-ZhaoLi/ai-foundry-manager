import type { LocalAccount } from '../schemas/account';
import { parseModels } from '../utils/common';
import { getSeries } from '../utils/modelSeries';

export interface AccountSummary {
  accountKey: string;
  regions: Record<string, { models: string[] }>;
  allModels: string[];
}

export interface SeriesSummary {
  [seriesName: string]: string[];
}

export interface GlobalSeriesSummary {
  allModels: string[];
  bySeries: SeriesSummary;
}

export function selectAccountSummaries(
  accounts: LocalAccount[]
): AccountSummary[] {
  return accounts
    .filter((account) => account.enabled !== false)
    .map((account) => {
      const regions: AccountSummary['regions'] = {};
      const allModels = new Set<string>();

      for (const region of account.regions.filter(
        (item) => item.enabled !== false
      )) {
        const models = parseModels(region.modelsText);
        if (!regions[region.name]) {
          regions[region.name] = { models: [] };
        }
        regions[region.name].models.push(...models);
        models.forEach((model) => allModels.add(model));
      }

      const normalizedRegions: AccountSummary['regions'] = {};
      Object.entries(regions).forEach(([name, info]) => {
        normalizedRegions[name] = {
          models: Array.from(new Set(info.models)).sort(),
        };
      });

      return {
        accountKey: account.name || account.id,
        regions: normalizedRegions,
        allModels: Array.from(allModels).sort(),
      };
    });
}

export function selectGlobalSeriesSummary(
  accountSummaries: AccountSummary[]
): GlobalSeriesSummary {
  const models = new Set<string>();
  accountSummaries.forEach((account) => {
    account.allModels.forEach((model) => models.add(model));
  });

  const allModels = Array.from(models).sort();
  const bySeries: SeriesSummary = {};
  allModels.forEach((model) => {
    const series = getSeries(model);
    if (!bySeries[series]) bySeries[series] = [];
    bySeries[series].push(model);
  });

  return { allModels, bySeries };
}
