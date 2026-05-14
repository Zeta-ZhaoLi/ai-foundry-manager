import { describe, it, expect } from 'vitest';

import {
  AZURE_CLI_DEPLOYMENT_COMMAND,
  AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND,
  buildAzureCliMultiRegionDeploymentScript,
  buildAzureCliDeploymentScript,
  buildAzureCliPowerShellDeploymentScript,
  buildAzureCliPowerShellMultiRegionDeploymentScript,
  getAzureCliDeploymentIdentity,
  resolveAzureCliDeploymentRows,
  toAzureCliDeploymentModels,
  validateAzureCliDeploymentInput,
} from '../azureCliDeployment';

const baseInput = {
  subscriptionId: '37753a40-cbd3-4042-913b-3dd5d5a56f87',
  accountEmail: 'user@example.com',
  resourceName: 'arthurphillips-6272-resource',
  location: 'eastus2',
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
      location: 'eastus2',
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
      location: 'eastus2',
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
      location: 'eastus2',
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
      capacity: 10000,
    });
  });

  it('generates only selected models in the MODELS block', () => {
    const script = buildAzureCliDeploymentScript({
      ...baseInput,
      models: [baseInput.models[0]],
    });

    expect(script).toContain(
      '"gpt-4o-2024-11-20|OpenAI|gpt-4o|2024-11-20|0"'
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
          location: 'eastus2',
          models: [baseInput.models[0]],
        },
        {
          label: 'swedencentral',
          resourceName: 'second-resource',
          location: 'swedencentral',
          models: [baseInput.models[1]],
        },
      ],
    });

    expect(script).toContain('# Prepare eastus2');
    expect(script).toContain('# Prepare swedencentral');
    expect(script).toContain('# Deploy eastus2');
    expect(script).toContain('# Deploy swedencentral');
    expect(script.match(/RESOURCE_GROUP="rg-first-region"/g)).toHaveLength(4);
    expect(script).toContain('ACCOUNT_NAME="first-resource"');
    expect(script).toContain('ACCOUNT_NAME="second-resource"');
    expect(script).toContain('ACCOUNT_LOCATION="eastus2"');
    expect(script).toContain('ACCOUNT_LOCATION="swedencentral"');
    expect(script).toContain('PROJECT_NAME="first"');
    expect(script).toContain('PROJECT_NAME="second"');
    expect(script).toContain('Prepare all selected regions first');
    expect(script).toContain('Deploy models after all selected regions are prepared');
    expect(script).toContain('unset AZURE_FOUNDRY_REPORT_PATH');
    expect(script).toContain('unset AZURE_FOUNDRY_REPORT_TIMESTAMP');
    expect(script).toContain('export AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE="prepare-only"');
    expect(script).toContain('export AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE="deploy-only"');
    expect(script.indexOf('# Prepare eastus2')).toBeLessThan(
      script.indexOf('# Prepare swedencentral')
    );
    expect(script.indexOf('# Prepare swedencentral')).toBeLessThan(
      script.indexOf('# Deploy eastus2')
    );
    expect(script.indexOf('# Deploy eastus2')).toBeLessThan(
      script.indexOf('# Deploy swedencentral')
    );
  });

  it('includes idempotent official Foundry resource and project setup', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('az group show --name "${RESOURCE_GROUP}"');
    expect(script).toContain('az group create \\');
    expect(script).toContain('az cognitiveservices account show \\');
    expect(script).toContain('az cognitiveservices account create \\');
    expect(script).toContain('--kind AIServices');
    expect(script).toContain('--allow-project-management');
    expect(script).toContain('az cognitiveservices account update \\');
    expect(script).toContain('--custom-domain "${ACCOUNT_NAME}"');
    expect(script).toContain('Custom domain is already set to');
    expect(script).toContain('Skip Foundry project creation because custom domain is not ready.');
    expect(script).toContain('az cognitiveservices account project show \\');
    expect(script).toContain('az cognitiveservices account project create \\');
    expect(script).toContain('already exists. Skip create.');
  });

  it('supports Service Principal login and subscription discovery when subscriptionId is empty', () => {
    const script = buildAzureCliDeploymentScript({
      ...baseInput,
      subscriptionId: '',
      servicePrincipal: {
        appId: 'app-id',
        password: 'secret',
        tenant: 'tenant-id',
      },
    });

    expect(script).toContain('az login --service-principal');
    expect(script).toContain('SP_APP_ID="app-id"');
    expect(script).toContain('az account list --query "[?state==');
    expect(script).toContain('Multiple enabled subscriptions found');
    expect(script).toContain('Select subscription number');
    expect(script).toContain('az account set --subscription "${SUBSCRIPTION_ID}"');
  });

  it('uses configured subscription directly when present with Service Principal', () => {
    const script = buildAzureCliDeploymentScript({
      ...baseInput,
      servicePrincipal: {
        appId: 'app-id',
        password: 'secret',
        tenant: 'tenant-id',
      },
    });

    expect(script).toContain(
      `CONFIGURED_SUBSCRIPTION_ID="${baseInput.subscriptionId}"`
    );
    expect(script).toContain('Using configured subscription');
    expect(script.indexOf('if [ -n "${CONFIGURED_SUBSCRIPTION_ID}" ]; then')).toBeLessThan(
      script.indexOf('AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID')
    );
  });

  it('prints account key and endpoint summary after deployment', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('az cognitiveservices account keys list \\');
    expect(script).toContain('SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"');
    expect(script).toContain('ACCOUNT_EMAIL="user@example.com"');
    expect(script).toContain('foundry-deployment-result-${report_account}-${SUBSCRIPTION_ID}-${REPORT_TIMESTAMP}.txt');
    expect(script).toContain('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN');
    expect(script).toContain('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END');
    expect(script).toContain('append_deployment_report');
    expect(script).toContain('aiServicesEndpoint');
    expect(script).toContain('deployments: $deployments');
    expect(script).toContain('Account access summary');
    expect(script).toContain('prepare_account_resources');
    expect(script).toContain('deploy_all_models');
    expect(script).toContain('Subscription ID:');
    expect(script).toContain('Foundry endpoint: https://${ACCOUNT_NAME}.services.ai.azure.com/api/projects/${PROJECT_NAME}');
    expect(script).toContain('OpenAI endpoint:  https://${ACCOUNT_NAME}.openai.azure.com');
    expect(script).toContain('Key1:');
  });

  it('generates PowerShell deployment script with official idempotent commands and key output', () => {
    const script = buildAzureCliPowerShellDeploymentScript({
      ...baseInput,
      servicePrincipal: {
        appId: 'app-id',
        password: 'secret',
        tenant: 'tenant-id',
      },
    });

    expect(script).toContain('deploy-foundry.ps1');
    expect(script).toContain("$ErrorActionPreference = 'Continue'");
    expect(script).toContain('function Ensure-AzureCli');
    expect(script).toContain('$ScriptDir = if ($PSScriptRoot)');
    expect(script).toContain("$AzureConfigDir = if ($env:AZURE_CONFIG_DIR)");
    expect(script).toContain("$env:AZURE_CONFIG_DIR = $AzureConfigDir");
    expect(script).toContain("Join-Path $ScriptDir '.azure-cli-profile'");
    expect(script).toContain("$AccountEmail = 'user@example.com'");
    expect(script).toContain('foundry-deployment-result-$reportAccount-$SubscriptionId-$ReportTimestamp.txt');
    expect(script).toContain('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN');
    expect(script).toContain('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END');
    expect(script).toContain('function Append-DeploymentReport');
    expect(script).toContain('winget install -e --id Microsoft.AzureCLI');
    expect(script).toContain('Refresh-AzureCliPath');
    expect(script).toContain('az login --service-principal');
    expect(script).toContain('Read-Host');
    expect(script).toContain('$selected = 0');
    expect(script).toContain('$ok = $false');
    expect(script).toContain('az group show --name $ResourceGroup');
    expect(script).toContain('az cognitiveservices account create');
    expect(script).toContain('--kind AIServices');
    expect(script).toContain('--allow-project-management');
    expect(script).toContain('Custom domain is already set to');
    expect(script).toContain("Could not set custom domain for '$AccountName'.");
    expect(script).toContain('Skip Foundry project creation because custom domain is not ready.');
    expect(script).toContain('az cognitiveservices account project show');
    expect(script).toContain("Invoke-AzureCli -Arguments @('rest','--method','put'");
    expect(script).toContain('modelCapacities');
    expect(script).toContain("$RaiPolicyName = 'Microsoft.Nil'");
    expect(script).toContain('raiPolicyName = $RaiPolicyName');
    expect(script).toContain('$deploymentPayloadPath = Join-Path');
    expect(script).toContain("'--body',('@' + $deploymentPayloadPath)");
    expect(script).toContain('Remove-Item -LiteralPath $deploymentPayloadPath');
    expect(script).toContain("$SkuName = 'GlobalStandard'");
    expect(script).not.toContain('DataZoneStandard');
    expect(script).not.toContain("'Standard'");
    expect(script).toContain('Select-GlobalStandardCapacity');
    expect(script).toContain('Get-ExistingDeploymentIfSameModel');
    expect(script).toContain("preserving this SKU");
    expect(script).toContain('Will force redeploy to $SkuName using configured max capacity.');
    expect(script).toContain('Force GlobalStandard target capacity from configured max capacity: $ConfiguredMaxCapacity');
    expect(script).toContain("$parts = $item -split '\\|', 5");
    expect(script).toContain(
      '$targetCapacity = $availableCapacity + [int]$existingCapacity'
    );
    expect(script).toContain('Used quota from existing deployment: $existingCapacity');
    expect(script).toContain('name = $selectedSkuName');
    expect(script).toContain('function Invoke-AzureCli');
    expect(script).toContain('function Invoke-AzureCliQuiet');
    expect(script).toContain("$stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) ('az-stderr-'");
    expect(script).toContain('$output = (& az @safeArguments 2> $stderrPath)');
    expect(script).toContain('$jsonText = (($output | Out-String).Trim())');
    expect(script).toContain("if ($Value -like '*&*')");
    expect(script).toContain("Invoke-AzureCliQuiet -Arguments @('rest','--method','get','--url',$url");
    expect(script).toContain('-QuietOnError');
    expect(script).toContain("'-o','jsonc') | Out-Host");
    expect(script).toContain('az cognitiveservices account keys list');
    expect(script).toContain('Account access summary');
    expect(script).toContain('Prepare-AccountResources');
    expect(script).toContain('Deploy-AllModels');
  });

  it('includes modelCapacities and max capacity logic', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('modelCapacities');
    expect(script).toContain('SKU_NAME="GlobalStandard"');
    expect(script).not.toContain('DataZoneStandard');
    expect(script).not.toContain('"Standard"');
    expect(script).toContain('select_global_standard_capacity');
    expect(script).toContain('get_existing_deployment_if_same_model');
    expect(script).toContain("preserving this SKU");
    expect(script).toContain('Will force redeploy to ${SKU_NAME} using configured max capacity.');
    expect(script).toContain('Force GlobalStandard target capacity from configured max capacity: ${configured_max_capacity}');
    expect(script).toContain('IFS=\'|\' read -r deployment_name model_format model_name model_version configured_max_capacity');
    expect(script).toContain('RAI_POLICY_NAME="Microsoft.Nil"');
    expect(script).toContain('raiPolicyName: $rai_policy_name');
    expect(script).toContain('--method put \\');
    expect(script).toContain(
      'Azure reports availableCapacity after existing deployments consume quota.'
    );
    expect(script).toContain(
      'target_capacity=$((available_capacity + existing_same_model_capacity))'
    );
    expect(script).toContain('Used quota from existing deployment: ${existing_same_model_capacity}');
    expect(script).toContain('deploy_model_with_max_capacity');
    expect(script).toContain('--url "${BASE_URL}/${deployment_name}?api-version=${DEPLOYMENT_API_VERSION}" \\');
    expect(script).toContain('--body "${deployment_payload}" \\');
  });

  it('allows generated scripts to skip existing deployments by default option', () => {
    const bashScript = buildAzureCliDeploymentScript({
      ...baseInput,
      overwriteExisting: false,
    });
    const powerShellScript = buildAzureCliPowerShellDeploymentScript({
      ...baseInput,
      overwriteExisting: false,
    });

    expect(bashScript).toContain('OVERWRITE_EXISTING="${OVERWRITE_EXISTING:-false}"');
    expect(powerShellScript).toContain("$OverwriteExisting = if ($env:OVERWRITE_EXISTING) { $env:OVERWRITE_EXISTING } else { 'false' }");
  });

  it('includes preflight, provider registration, and deployment summary logic', () => {
    const script = buildAzureCliDeploymentScript(baseInput);

    expect(script).toContain('set -uo pipefail');
    expect(script).toContain('install_azure_cli_if_missing');
    expect(script).toContain('https://aka.ms/InstallAzureCLIDeb');
    expect(script).toContain('brew install azure-cli');
    expect(script).toContain('install_jq_if_missing');
    expect(script).toContain('apt-get install -y jq');
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

    expect(script).toContain('locations/${ACCOUNT_LOCATION}/modelCapacities');
    expect(script).toContain('.location // .properties.location // $location');
    expect(script).toContain('.properties.skuName // .sku.name // .skuName // .name // ""');
    expect(script).toContain('.properties.availableCapacity // .availableCapacity // 0');
    expect(script).toContain('map(tonumber? // 0)');
  });

  it('returns clear validation errors for missing required fields', () => {
    const result = validateAzureCliDeploymentInput({
      ...baseInput,
      subscriptionId: '',
      resourceName: '',
      location: '',
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
    expect(result.errors).toContain(
      'subscriptionId or complete servicePrincipal is required'
    );
    expect(result.errors).toContain('resourceName is required');
    expect(result.errors).toContain('location is required');
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
    expect(AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND).toBe(
      [
        'Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass',
        '.\\deploy-foundry.ps1',
      ].join('\n')
    );
  });

  it('builds a multi-region PowerShell script with shared resource group and per-region identity', () => {
    const script = buildAzureCliPowerShellMultiRegionDeploymentScript({
      subscriptionId: baseInput.subscriptionId,
      resourceGroupName: 'rg-first-region',
      targets: [
        {
          label: 'eastus2',
          resourceName: 'first-resource',
          location: 'eastus2',
          models: [baseInput.models[0]],
        },
        {
          label: 'swedencentral',
          resourceName: 'second-resource',
          location: 'swedencentral',
          models: [baseInput.models[1]],
        },
      ],
    });

    expect(script).toContain('# Prepare eastus2');
    expect(script).toContain('# Prepare swedencentral');
    expect(script).toContain('# Deploy eastus2');
    expect(script).toContain('# Deploy swedencentral');
    expect(script.match(/\$ResourceGroup = 'rg-first-region'/g)).toHaveLength(
      4
    );
    expect(script).toContain("$AccountName = 'first-resource'");
    expect(script).toContain("$AccountName = 'second-resource'");
    expect(script).toContain("$AccountLocation = 'eastus2'");
    expect(script).toContain("$AccountLocation = 'swedencentral'");
    expect(script).toContain('Prepare all selected regions first');
    expect(script).toContain('Deploy models after all selected regions are prepared');
    expect(script).toContain('Remove-Item Env:AZURE_FOUNDRY_REPORT_PATH');
    expect(script).toContain('Remove-Item Env:AZURE_FOUNDRY_REPORT_TIMESTAMP');
    expect(script).toContain('Remove-Item Env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID');
    expect(script).toContain("$env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID = 'true'");
    expect(script).toContain('Remove-Item Env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID');
    expect(script).toContain('Remove-Item Env:AZURE_CONFIG_DIR');
    expect(script).toContain("$env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE = 'prepare-only'");
    expect(script).toContain("$env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE = 'deploy-only'");
    expect(script.indexOf('# Prepare eastus2')).toBeLessThan(
      script.indexOf('# Prepare swedencentral')
    );
    expect(script.indexOf('# Prepare swedencentral')).toBeLessThan(
      script.indexOf('# Deploy eastus2')
    );
    expect(script.indexOf('# Deploy eastus2')).toBeLessThan(
      script.indexOf('# Deploy swedencentral')
    );
  });
});
