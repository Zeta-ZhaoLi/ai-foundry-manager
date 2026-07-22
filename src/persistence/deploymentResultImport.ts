import type { LocalAccount, LocalRegion } from '../schemas/account';
import {
  parseDeploymentResultText,
  type DeploymentResultRegion,
} from '../utils/deploymentResultImport';
import { generateId } from '../utils/common';

export interface DeploymentResultImportSummary {
  success: boolean;
  error?: string;
  updatedAccounts?: number;
  updatedRegions?: number;
  addedRegions?: number;
}

export interface DeploymentResultImportResult {
  summary: DeploymentResultImportSummary;
  accounts?: LocalAccount[];
}

function normalizeMatchValue(value?: string): string {
  return (value || '').trim().toLowerCase().replace(/\/+$/, '');
}

function regionMatchesDeploymentResult(
  region: LocalRegion,
  resultRegion: DeploymentResultRegion
): boolean {
  const resultValues = [
    resultRegion.resourceName,
    resultRegion.foundryProjectEndpoint,
    resultRegion.openaiEndpoint,
    resultRegion.aiServicesEndpoint,
    resultRegion.region,
  ]
    .map(normalizeMatchValue)
    .filter(Boolean);

  const regionValues = [
    region.deployment?.resourceName,
    region.foundryProjectEndpoint,
    region.openaiEndpoint,
    region.aiServicesEndpoint,
    region.name,
  ]
    .map(normalizeMatchValue)
    .filter(Boolean);

  return resultValues.some((value) => regionValues.includes(value));
}

function accountMatchesDeploymentResult(
  account: LocalAccount,
  resultRegions: DeploymentResultRegion[]
): boolean {
  return account.regions.some((region) => {
    const regionValues = [
      region.deployment?.resourceName,
      region.foundryProjectEndpoint,
      region.openaiEndpoint,
      region.aiServicesEndpoint,
    ]
      .map(normalizeMatchValue)
      .filter(Boolean);

    return resultRegions.some((resultRegion) => {
      const resultValues = [
        resultRegion.resourceName,
        resultRegion.foundryProjectEndpoint,
        resultRegion.openaiEndpoint,
        resultRegion.aiServicesEndpoint,
      ]
        .map(normalizeMatchValue)
        .filter(Boolean);

      return resultValues.some((value) => regionValues.includes(value));
    });
  });
}

export function applyDeploymentResultImport(
  accounts: LocalAccount[],
  text: string
): DeploymentResultImportResult {
  try {
    const parsed = parseDeploymentResultText(text);
    const parsedSubscriptionId = parsed.subscriptionId?.trim() || '';
    const importableRegions = parsed.regions.filter((region) =>
      Boolean(region.apiKey?.trim())
    );

    if (!parsedSubscriptionId && importableRegions.length === 0) {
      return {
        summary: {
          success: false,
          error: 'No subscription ID or API keys found in deployment result',
        },
      };
    }

    let matchIndex = parsedSubscriptionId
      ? accounts.findIndex(
          (account) =>
            normalizeMatchValue(account.subscriptionId) ===
            normalizeMatchValue(parsedSubscriptionId)
        )
      : -1;

    if (matchIndex < 0) {
      matchIndex = accounts.findIndex((account) =>
        accountMatchesDeploymentResult(account, parsed.regions)
      );
    }

    if (matchIndex < 0) {
      return {
        summary: {
          success: false,
          error: 'No matching account found for this deployment result',
        },
      };
    }

    const matchedAccount = accounts[matchIndex];
    let regions = matchedAccount.regions;
    let updatedRegions = 0;
    let addedRegions = 0;

    for (const resultRegion of importableRegions) {
      const regionIndex = regions.findIndex((region) =>
        regionMatchesDeploymentResult(region, resultRegion)
      );

      if (regionIndex >= 0) {
        const current = regions[regionIndex];
        if (current.apiKey !== resultRegion.apiKey) {
          updatedRegions += 1;
          regions = regions.map((region, index) =>
            index === regionIndex
              ? { ...region, apiKey: resultRegion.apiKey }
              : region
          );
        }
      } else {
        addedRegions += 1;
        regions = [
          ...regions,
          {
            id: generateId('region'),
            name: resultRegion.region,
            modelsText: '',
            apiKey: resultRegion.apiKey,
            enabled: true,
          },
        ];
      }
    }

    const nextAccount: LocalAccount = {
      ...matchedAccount,
      subscriptionId: parsedSubscriptionId || matchedAccount.subscriptionId,
      regions,
    };
    const nextAccounts = accounts.map((account, index) =>
      index === matchIndex ? nextAccount : account
    );

    return {
      accounts: nextAccounts,
      summary: {
        success: true,
        updatedAccounts: 1,
        updatedRegions,
        addedRegions,
      },
    };
  } catch (error) {
    return {
      summary: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
