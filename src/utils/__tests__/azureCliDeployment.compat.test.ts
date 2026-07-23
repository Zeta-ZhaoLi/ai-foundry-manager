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
        "bash": "2f5a0fc10c6414bce0134a2b9a40c44eb49f4a8d53e905d87f810b93cbb75d68",
        "bashMultiRegion": "d4cc118be5c2e2d4df09059b212ababab806b1fcc3d1e2e26133c41926496386",
        "powershell": "e789d084d5f6780dc93ed2ab0466266cacaf69b39aac2d49fc1f264d92dc3ed4",
        "powershellMultiRegion": "7de9f62d0de3ae76f3960511a94bc26119768c9dbb83edf4233127b118d86bd2",
      }
    `);
  });
});
