import { describe, it, expect } from 'vitest';

import {
  AZURE_CLI_DEPLOYMENT_COMMAND,
  buildAzureCliMultiRegionDeploymentScript,
  buildAzureCliDeploymentScript,
  getAzureCliDeploymentIdentity,
  resolveAzureCliDeploymentRows,
  toAzureCliDeploymentModels,
  validateAzureCliDeploymentInput,
} from '../azureCliDeployment';

const baseInput = {
  subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
  resourceName: 'arthurphillips-6272-resource',
  foundryProjectEndpoint:
    'https://arthurphillips-6272-resource.services.ai.azure.com/api/projects/arthurphillips-6272',
  models: [
    {
      deploymentName: 'gpt-4o-2024-11-20',
      modelFormat: 'OpenAI',
      modelName: 'gpt-4o',
      version: '2024-11-20',
    },
    {
      deploymentName: 'gpt-4o-mini-2024-07-18',
      modelFormat: 'OpenAI',
      modelName: 'gpt-4o-mini',
      version: '2024-07-18',
    },
  ],
};

describe('azureCliDeployment', () => {
  it('derives account and resource group from Foundry Project Endpoint', () => {
    expect(getAzureCliDeploymentIdentity(baseInput)).toEqual({
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      resourceGroup: 'rg-arthurphillips-6272',
      accountName: 'arthurphillips-6272-resource',
      projectId: 'arthurphillips-6272',
    });
  });

  it('falls back to resourceName when Foundry Project Endpoint is empty', () => {
    expect(
      getAzureCliDeploymentIdentity({
        ...baseInput,
        foundryProjectEndpoint: '',
      })
    ).toEqual({
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      resourceGroup: 'rg-arthurphillips-6272',
      accountName: 'arthurphillips-6272-resource',
      projectId: 'arthurphillips-6272',
    });
  });

  it('allows resource group override for resources created under the first region group', () => {
    expect(
      getAzureCliDeploymentIdentity({
        ...baseInput,
        resourceGroupName: 'rg-first-region',
      })
    ).toEqual({
      subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
      resourceGroup: 'rg-first-region',
      accountName: 'arthurphillips-6272-resource',
      projectId: 'arthurphillips-6272',
    });
  });

  it('resolves deployment rows from master models and includes disabled rows when requested', () => {
    const rows = resolveAzureCliDeploymentRows(['gpt-5.1-2025-11-13']);
    const models = toAzureCliDeploymentModels(rows, { includeDisabled: true });

    expect(models[0]).toEqual({
      deploymentName: 'gpt-5.1-2025-11-13',
      modelName: 'gpt-5.1',
      version: '2025-11-13',
      modelFormat: 'OpenAI',
    });
  });

  it('generates only selected models in the MODELS block', () => {
    const script = buildAzureCliDeploymentScript({
      ...baseInput,
      models: [baseInput.models[0]],
    });

    expect(script).toContain(
      '"gpt-4o-2024-11-20|OpenAI|gpt-4o|2024-11-20"'
    );
    expect(script).not.toContain('gpt-4o-mini-2024-07-18');
  });

  it('builds a multi-region script using the shared first-region resource group', () => {
    const script = buildAzureCliMultiRegionDeploymentScript({
      subscriptionId: baseInput.subscriptionId,
      resourceGroupName: 'rg-first-region',
      targets: [
        {
          label: 'eastus2',
          resourceName: 'first-resource',
          models: [baseInput.models[0]],
        },
        {
          label: 'swedencentral',
          resourceName: 'second-resource',
          models: [baseInput.models[1]],
        },
      ],
    });

    expect(script).toContain('# eastus2');
    expect(script).toContain('# swedencentral');
    expect(script.match(/RESOURCE_GROUP="rg-first-region"/g)).toHaveLength(2);
    expect(script).toContain('ACCOUNT_NAME="first-resource"');
    expect(script).toContain('ACCOUNT_NAME="second-resource"');
  });

  it('includes modelCapacities and max capacity logic', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('modelCapacities');
    expect(script).toContain(
      'target_capacity=$((available_capacity + existing_same_model_capacity))'
    );
    expect(script).toContain('deploy_model_with_max_capacity');
  });

  it('includes preflight, provider registration, and deployment summary logic', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('set -uo pipefail');
    expect(script).toContain('AUTO_REGISTER_PROVIDER="${AUTO_REGISTER_PROVIDER:-true}"');
    expect(script).toContain('ensure_provider_registered || true');
    expect(script).toContain('command -v jq');
    expect(script).toContain('SUCCEEDED_DEPLOYMENTS=()');
    expect(script).toContain('SKIPPED_DEPLOYMENTS=()');
    expect(script).toContain('FAILED_DEPLOYMENTS=()');
    expect(script).toContain('Deployment summary');
  });

  it('continues after per-model failures and classifies return codes', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('return 2');
    expect(script).toContain('SKIPPED: ${deployment_name}');
    expect(script).toContain('FAILED: ${deployment_name}');
    expect(script).toContain('Continue to next deployment...');
    expect(script).toContain('if ! az rest \\');
  });

  it('prints a copyable import list with succeeded model and deployment names', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('print_copyable_model_import_list');
    expect(script).toContain('Copyable model import list');
    expect(script).toContain('Copy this comma-separated list into the model list import field:');
    expect(script).toContain('properties.provisioningState');
    expect(script).toContain('| [(.properties.model.name // ""), (.name // "")]');
    expect(script).toContain('reduce .[] as $name ([]; if index($name) then . else . + [$name] end)');
    expect(script).toContain('join(", ")');
  });

  it('uses the resilient model capacity JSON shape from the template', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('.location // .properties.location // ""');
    expect(script).toContain('.properties.skuName // .sku.name // .name // ""');
    expect(script).toContain('.properties.availableCapacity // .availableCapacity // 0');
    expect(script).toContain('map(tonumber? // 0)');
  });

  it('returns clear validation errors for missing required fields', () => {
    const result = validateAzureCliDeploymentInput({
      ...baseInput,
      subscriptionId: '',
      resourceName: '',
      foundryProjectEndpoint: '',
      models: [
        {
          deploymentName: '',
          modelFormat: '',
          modelName: 'gpt-4o',
          version: '',
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('subscriptionId is required');
    expect(result.errors).toContain('resourceName is required');
    expect(result.errors).toContain('deploymentName is required');
    expect(result.errors).toContain('modelFormat is required');
    expect(result.errors).toContain('version is required');
  });

  it('exposes the fixed script run command', () => {
    expect(AZURE_CLI_DEPLOYMENT_COMMAND).toBe(
      [
        "sed -i 's/\\r$//' deploy-models.sh",
        'chmod +x deploy-models.sh',
        './deploy-models.sh',
      ].join('\n')
    );
  });
});
