import { describe, expect, it } from 'vitest';

import {
  buildAzureCliDeploymentScript,
  buildAzureCliMultiRegionDeploymentScript,
  buildAzureCliPowerShellDeploymentScript,
  buildAzureCliPowerShellMultiRegionDeploymentScript,
  type AzureCliDeploymentInput,
  type AzureCliMultiRegionDeploymentInput,
} from '../azureCliDeployment';

const input: AzureCliDeploymentInput = {
  subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
  accountEmail: 'user+foundry@example.com',
  resourceGroupName: 'rg-shared-foundry',
  resourceName: 'foundry-eastus2',
  location: 'eastus2',
  foundryProjectEndpoint:
    'https://foundry-eastus2.services.ai.azure.com/api/projects/foundry-project',
  servicePrincipal: {
    appId: '00000000-0000-0000-0000-000000000001',
    password: 'quote\'"-$`-value',
    tenant: '00000000-0000-0000-0000-000000000002',
  },
  models: [
    {
      deploymentName: 'gpt-4o-2024-11-20',
      modelFormat: 'OpenAI',
      modelName: 'gpt-4o',
      version: '2024-11-20',
      capacity: 120,
    },
    {
      deploymentName: 'claude-sonnet-4-5',
      modelFormat: 'Anthropic',
      modelName: 'claude-sonnet-4-5',
      version: '20250929',
      capacity: 25,
    },
  ],
  overwriteExisting: false,
};

const multiRegionInput: AzureCliMultiRegionDeploymentInput = {
  subscriptionId: input.subscriptionId,
  accountEmail: input.accountEmail,
  resourceGroupName: input.resourceGroupName!,
  servicePrincipal: input.servicePrincipal,
  overwriteExisting: input.overwriteExisting,
  targets: [
    {
      label: 'East US 2',
      resourceName: input.resourceName,
      location: input.location,
      foundryProjectEndpoint: input.foundryProjectEndpoint,
      models: input.models,
    },
    {
      label: 'Sweden\nCentral',
      resourceName: 'foundry-sweden',
      location: 'swedencentral',
      models: [input.models[0]],
    },
  ],
};

async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

describe('Azure CLI deployment output compatibility', () => {
  it('keeps Bash and PowerShell output byte-for-byte stable', async () => {
    const [bash, bashMultiRegion, powershell, powershellMultiRegion] =
      await Promise.all([
        digest(buildAzureCliDeploymentScript(input)),
        digest(buildAzureCliMultiRegionDeploymentScript(multiRegionInput)),
        digest(buildAzureCliPowerShellDeploymentScript(input)),
        digest(
          buildAzureCliPowerShellMultiRegionDeploymentScript(multiRegionInput)
        ),
      ]);

    expect({
      bash,
      bashMultiRegion,
      powershell,
      powershellMultiRegion,
    }).toMatchInlineSnapshot(`
      {
        "bash": "45b777c427d31bc08f47d798cf8b5cab607ddf87d9aed6928c7d4cf5de3675fc",
        "bashMultiRegion": "bc7264eb102c61339cb23a65ce79840907d8a21dea25be8a077ce9a407ce7c3b",
        "powershell": "af30129887db461033ccaa3a68889ba2f76708b67e9eba59e74f6bb9915f6f24",
        "powershellMultiRegion": "c3f0abe33b046a88df67c7b0cb2c76096d44670b17b8c80320d06c093a0dfbe3",
      }
    `);
  });
});
