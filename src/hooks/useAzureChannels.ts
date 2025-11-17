import { useEffect, useMemo, useState } from 'react';
import { NewApiClient } from '../api/newApiClient';
import type { Channel } from '../types/channel';
import { getSeries } from '../utils/modelSeries';

export interface AzureChannelModels {
  [channelId: number]: string[];
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

function guessRegion(channel: Channel): string {
  const candidates: string[] = [];
  if (channel.remark) candidates.push(channel.remark);
  if (channel.name) candidates.push(channel.name);
  if (channel.base_url) candidates.push(channel.base_url);

  const text = candidates.join(' ').toLowerCase();
  const regionPattern =
    /(eastus2?|westus3?|northcentralus|southcentralus|centralus|canadacentral|swedencentral|francecentral|northeurope|westeurope|uksouth|germanywestcentral|switzerlandnorth|japaneast|japanwest|koreacentral|southindia|australiaeast|brazilsouth)/;
  const match = text.match(regionPattern);
  if (match && match[0]) {
    return match[0];
  }
  return channel.name || `channel-${channel.id}`;
}

export function useAzureChannels(client: NewApiClient) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelModels, setChannelModels] = useState<AzureChannelModels>({});
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    async function loadChannels() {
      setLoadingChannels(true);
      setError(null);
      try {
        const list = await client.listAzureChannels();
        if (!canceled) {
          setChannels(list);
        }
      } catch (e: any) {
        if (!canceled) {
          setError(e?.message || String(e));
        }
      } finally {
        if (!canceled) {
          setLoadingChannels(false);
        }
      }
    }
    loadChannels();
    return () => {
      canceled = true;
    };
  }, [client]);

  const loadAllModels = async () => {
    setLoadingModels(true);
    setError(null);
    try {
      const results: AzureChannelModels = {};
      for (const ch of channels) {
        try {
          const models = await client.fetchChannelModels(ch.id);
          results[ch.id] = models;
        } catch {
          // 失败的渠道就留空，但不阻塞整体
          results[ch.id] = [];
        }
      }
      setChannelModels(results);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoadingModels(false);
    }
  };

  const accountSummaries: AccountSummary[] = useMemo(() => {
    const accounts: { [key: string]: AccountSummary } = {};
    for (const ch of channels) {
      const accountKey = ch.tag || '默认账号';
      if (!accounts[accountKey]) {
        accounts[accountKey] = {
          accountKey,
          regions: {},
          allModels: [],
        };
      }
      const regionLabel = guessRegion(ch);
      if (!accounts[accountKey].regions[regionLabel]) {
        accounts[accountKey].regions[regionLabel] = { models: [] };
      }
      const models = channelModels[ch.id] || [];
      accounts[accountKey].regions[regionLabel].models.push(...models);
      accounts[accountKey].allModels.push(...models);
    }

    // 去重和排序
    return Object.values(accounts).map((acc) => {
      const regionEntries = Object.entries(acc.regions).map(
        ([label, info]) => {
          const unique = Array.from(new Set(info.models)).sort();
          return [label, { models: unique }] as const;
        },
      );
      const regions = Object.fromEntries(regionEntries);
      const allModels = Array.from(new Set(acc.allModels)).sort();
      return { ...acc, regions, allModels };
    });
  }, [channels, channelModels]);

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
    channels,
    channelModels,
    accountSummaries,
    globalSeriesSummary,
    loadingChannels,
    loadingModels,
    error,
    loadAllModels,
  };
}

