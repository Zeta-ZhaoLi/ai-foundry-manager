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
        "bash": "bb26810566a28d10966984731172ae11ec10a4faf4299fcf51603da92c4c8b21",
        "bashMultiRegion": "133a955eac118fc562ba053e0eb4192a3286cb6464b433b5f16110983bece6d6",
        "powershell": "1a53afe348878acc27d377bde422c6fd917c6ac2d1b23a660c9cf7114eafc7be",
        "powershellMultiRegion": "c7fd36cfca26bd2bed36f3f72f1236da6f14c469a6dcec8dbaae451a9aa42939",
      }
    `);
  });
});
