import { getDefaultProjectIdFromResourceName } from './common';
import {
  getFallbackModelDeploymentDefaults,
  getTemplateModelDeploymentByDeploymentNameMap,
  getTemplateModelDeploymentEntriesByModelNameMap,
} from './armTemplate';

export interface AzureCliDeploymentModel {
  deploymentName: string;
  modelFormat: string;
  modelName: string;
  version: string;
  capacity?: number;
}

export interface AzureCliDeploymentModelOverride {
  enabled?: boolean;
  deploymentName?: string;
  modelFormat?: string;
  version?: string;
  capacity?: number;
}

export interface AzureCliServicePrincipal {
  appId: string;
  displayName?: string;
  password?: string;
  tenant: string;
}

export interface AzureCliDeploymentRow extends AzureCliDeploymentModel {
  sourceModel: string;
  enabled: boolean;
  capacity: number;
}

export interface AzureCliDeploymentInput {
  subscriptionId?: string;
  servicePrincipal?: AzureCliServicePrincipal;
  accountEmail?: string;
  resourceName: string;
  location: string;
  resourceGroupName?: string;
  foundryProjectEndpoint?: string;
  models: AzureCliDeploymentModel[];
  overwriteExisting?: boolean;
}

export interface AzureCliDeploymentTargetInput {
  resourceName: string;
  location: string;
  resourceGroupName?: string;
  foundryProjectEndpoint?: string;
  label?: string;
  models: AzureCliDeploymentModel[];
}

export interface AzureCliMultiRegionDeploymentInput {
  subscriptionId?: string;
  servicePrincipal?: AzureCliServicePrincipal;
  accountEmail?: string;
  resourceGroupName: string;
  targets: AzureCliDeploymentTargetInput[];
  overwriteExisting?: boolean;
}

export interface AzureCliDeploymentIdentity {
  subscriptionId: string;
  resourceGroup: string;
  accountName: string;
  projectId: string;
  location: string;
}

export interface AzureCliDeploymentValidation {
  valid: boolean;
  errors: string[];
}

export const AZURE_CLI_DEPLOYMENT_COMMAND = [
  "sed -i 's/\\r$//' deploy-models.sh",
  'chmod +x deploy-models.sh',
  './deploy-models.sh',
].join('\n');

export const AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND = [
  'Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass',
  '.\\deploy-foundry.ps1',
].join('\n');

function shellDoubleQuote(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
}

function powershellSingleQuote(value: string): string {
  return value.replace(/'/g, "''");
}

function hasCompleteServicePrincipal(
  servicePrincipal?: AzureCliServicePrincipal
): boolean {
  return Boolean(
    servicePrincipal?.appId.trim() &&
      servicePrincipal?.tenant.trim() &&
      servicePrincipal?.password?.trim()
  );
}

function deriveIdentity(
  input: AzureCliDeploymentInput
): AzureCliDeploymentIdentity | null {
  const subscriptionId = input.subscriptionId?.trim() || '';
  const resourceName = input.resourceName.trim();
  const location = input.location.trim();
  const endpoint = (input.foundryProjectEndpoint || '').trim();

  let accountName = resourceName;
  let projectId = getDefaultProjectIdFromResourceName(resourceName);

  if (endpoint) {
    try {
      const url = new URL(endpoint);
      const hostMatch = url.hostname.match(/^([^.]+)\.services\.ai\.azure\.com$/);
      if (!hostMatch) return null;
      accountName = hostMatch[1];

      const path = url.pathname.replace(/\/+$/, '');
      const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
      if (!projectMatch) return null;
      projectId = decodeURIComponent(projectMatch[1]);
    } catch {
      return null;
    }
  }

  if (!accountName || !projectId || !location) return null;

  return {
    subscriptionId,
    resourceGroup: input.resourceGroupName?.trim() || `rg-${projectId}`,
    accountName,
    projectId,
    location,
  };
}

export function getAzureCliDeploymentIdentity(
  input: AzureCliDeploymentInput
): AzureCliDeploymentIdentity | null {
  return deriveIdentity(input);
}

export function validateAzureCliDeploymentInput(
  input: AzureCliDeploymentInput
): AzureCliDeploymentValidation {
  const errors: string[] = [];

  if (!input.resourceName.trim()) errors.push('resourceName is required');
  if (!input.location.trim()) errors.push('location is required');
  if (input.models.length === 0) errors.push('models are required');
  if (!deriveIdentity(input)) {
    errors.push('Foundry Project Endpoint or resourceName is invalid');
  }

  const seen = new Set<string>();
  for (const model of input.models) {
    const deploymentName = model.deploymentName.trim();
    const modelName = model.modelName.trim();
    const modelFormat = model.modelFormat.trim();
    const version = model.version.trim();

    if (!deploymentName) errors.push('deploymentName is required');
    if (deploymentName) {
      if (seen.has(deploymentName)) {
        errors.push(`deploymentName must be unique: ${deploymentName}`);
      }
      seen.add(deploymentName);
    }
    if (!modelName) errors.push('modelName is required');
    if (!modelFormat) errors.push('modelFormat is required');
    if (!version) errors.push('version is required');
  }

  return { valid: errors.length === 0, errors };
}

export function stringifyAzureCliModelRows(
  models: AzureCliDeploymentModel[]
): string {
  return models
    .map(
      (model) =>
        `  "${shellDoubleQuote(model.deploymentName.trim())}|${shellDoubleQuote(
          model.modelFormat.trim()
        )}|${shellDoubleQuote(model.modelName.trim())}|${shellDoubleQuote(
          model.version.trim()
        )}|${Math.max(0, Math.floor(model.capacity ?? 0))}"`
    )
    .join('\n');
}

export function resolveAzureCliDeploymentRows(
  modelNames: string[],
  overrides: Record<string, AzureCliDeploymentModelOverride> = {}
): AzureCliDeploymentRow[] {
  const templateDefaultsByModelNameMap =
    getTemplateModelDeploymentEntriesByModelNameMap();
  const templateByDeploymentNameMap =
    getTemplateModelDeploymentByDeploymentNameMap();

  const redirectedModelNames = new Set<string>();
  for (const modelName of modelNames) {
    const match = templateByDeploymentNameMap.get(modelName);
    if (match) redirectedModelNames.add(match.modelName);
  }

  return modelNames.map((modelName) => {
    const cfg = overrides[modelName] || {};
    const deploymentMatch = templateByDeploymentNameMap.get(modelName);
    const resolvedModelName = deploymentMatch?.modelName || modelName;
    const fallback = getFallbackModelDeploymentDefaults(resolvedModelName);
    const templateDefaults =
      deploymentMatch ||
      templateDefaultsByModelNameMap.get(resolvedModelName)?.[0];
    const defaultEnabled = deploymentMatch
      ? true
      : !redirectedModelNames.has(resolvedModelName);

    return {
      sourceModel: modelName,
      modelName: resolvedModelName,
      enabled: cfg.enabled ?? defaultEnabled,
      deploymentName:
        cfg.deploymentName ??
        templateDefaults?.deploymentName ??
        fallback.deploymentName,
      version: cfg.version ?? templateDefaults?.version ?? fallback.version,
      modelFormat:
        cfg.modelFormat ?? templateDefaults?.modelFormat ?? fallback.modelFormat,
      capacity: cfg.capacity ?? templateDefaults?.capacity ?? fallback.capacity,
    };
  });
}

export function toAzureCliDeploymentModels(
  rows: AzureCliDeploymentRow[],
  options: { includeDisabled?: boolean } = {}
): AzureCliDeploymentModel[] {
  return rows
    .filter((row) => options.includeDisabled || row.enabled !== false)
    .map((row) => ({
      deploymentName: row.deploymentName.trim(),
      modelName: row.modelName.trim(),
      version: row.version.trim(),
      modelFormat: row.modelFormat.trim(),
      capacity: row.capacity,
    }));
}

function buildAzureCliDeploymentScriptBody(
  identity: AzureCliDeploymentIdentity,
  modelRows: string,
  servicePrincipal?: AzureCliServicePrincipal,
  accountEmail = '',
  overwriteExisting = true
): string {
  const configuredSubscriptionId = identity.subscriptionId;
  const sp = servicePrincipal;
  const overwriteDefault = overwriteExisting ? 'true' : 'false';
  return `# Deployment method: save as deploy-models.sh, then run:
# ${AZURE_CLI_DEPLOYMENT_COMMAND.split('\n').join('\n# ')}

#!/usr/bin/env bash
set -uo pipefail

# ============================================================
# Basic configuration
# ============================================================
CONFIGURED_SUBSCRIPTION_ID="${shellDoubleQuote(configuredSubscriptionId)}"
SUBSCRIPTION_ID="${shellDoubleQuote(configuredSubscriptionId)}"
SP_APP_ID="${shellDoubleQuote(sp?.appId || '')}"
SP_PASSWORD="${shellDoubleQuote(sp?.password || '')}"
SP_TENANT="${shellDoubleQuote(sp?.tenant || '')}"
ACCOUNT_EMAIL="${shellDoubleQuote(accountEmail)}"
RESOURCE_GROUP="${shellDoubleQuote(identity.resourceGroup)}"
RESOURCE_GROUP_LOCATION="${shellDoubleQuote(identity.location)}"
ACCOUNT_NAME="${shellDoubleQuote(identity.accountName)}"
ACCOUNT_LOCATION="${shellDoubleQuote(identity.location)}"
PROJECT_NAME="${shellDoubleQuote(identity.projectId)}"
DEPLOYMENT_API_VERSION="2025-09-01"
CAPACITY_API_VERSION="2025-06-01"
RAI_POLICY_NAME="Microsoft.Nil"
VERSION_UPGRADE_OPTION="OnceNewDefaultVersionAvailable"

SKU_NAME="GlobalStandard"

# false = skip existing deployments
# true  = update existing deployments
OVERWRITE_EXISTING="\${OVERWRITE_EXISTING:-${overwriteDefault}}"

# Optional: try to register provider before deployment
AUTO_REGISTER_PROVIDER="\${AUTO_REGISTER_PROVIDER:-true}"

# all = prepare resources, print account summary, deploy models, print final summary
# prepare-only = prepare resources and print account summary, skip model deployment
# deploy-only = skip resource preparation and deploy models
DEPLOYMENT_RUN_MODE="\${AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE:-all}"
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
export AZURE_CONFIG_DIR="\${AZURE_CONFIG_DIR:-\${SCRIPT_DIR}/.azure-cli-profile}"
mkdir -p "\${AZURE_CONFIG_DIR}"
REPORT_TIMESTAMP="\${AZURE_FOUNDRY_REPORT_TIMESTAMP:-$(date +%Y%m%d-%H%M%S)}"

# ============================================================
# Result arrays
# ============================================================
SUCCEEDED_DEPLOYMENTS=()
SKIPPED_DEPLOYMENTS=()
FAILED_DEPLOYMENTS=()

# ============================================================
# Preflight
# ============================================================
install_azure_cli_if_missing() {
  if command -v az >/dev/null 2>&1; then
    return 0
  fi

  echo "Azure CLI was not found. Attempting automatic installation..."

  if command -v apt-get >/dev/null 2>&1 && command -v curl >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    else
      curl -sL https://aka.ms/InstallAzureCLIDeb | bash
    fi
  elif command -v brew >/dev/null 2>&1; then
    brew update
    brew install azure-cli
  else
    echo "ERROR: Azure CLI is required but was not found."
    echo "Install it from: https://learn.microsoft.com/cli/azure/install-azure-cli"
    exit 1
  fi

  if ! command -v az >/dev/null 2>&1; then
    echo "ERROR: Azure CLI installation did not put 'az' on PATH."
    echo "Open a new shell or install Azure CLI manually."
    exit 1
  fi
}

install_jq_if_missing() {
  if command -v jq >/dev/null 2>&1; then
    return 0
  fi

  echo "jq was not found. Attempting automatic installation..."

  if command -v apt-get >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo apt-get update
      sudo apt-get install -y jq
    else
      apt-get update
      apt-get install -y jq
    fi
  elif command -v brew >/dev/null 2>&1; then
    brew install jq
  elif command -v dnf >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo dnf install -y jq
    else
      dnf install -y jq
    fi
  elif command -v yum >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo yum install -y jq
    else
      yum install -y jq
    fi
  else
    echo "ERROR: jq is required but was not found."
    echo "Azure Cloud Shell normally includes jq."
    exit 1
  fi

  if ! command -v jq >/dev/null 2>&1; then
    echo "ERROR: jq installation did not put 'jq' on PATH."
    exit 1
  fi
}

install_azure_cli_if_missing
install_jq_if_missing

login_and_select_subscription() {
  if [ -n "\${SP_APP_ID}" ] || [ -n "\${SP_PASSWORD}" ] || [ -n "\${SP_TENANT}" ]; then
    if [ -z "\${SP_APP_ID}" ] || [ -z "\${SP_PASSWORD}" ] || [ -z "\${SP_TENANT}" ]; then
      echo "ERROR: Service Principal requires appId, password, and tenant."
      exit 1
    fi

    echo "Logging in with Service Principal..."
    if ! az login --service-principal --username "\${SP_APP_ID}" --password "\${SP_PASSWORD}" --tenant "\${SP_TENANT}" -o none; then
      echo "ERROR: Service Principal login failed."
      exit 1
    fi
  fi

  if [ -n "\${CONFIGURED_SUBSCRIPTION_ID}" ]; then
    SUBSCRIPTION_ID="\${CONFIGURED_SUBSCRIPTION_ID}"
    echo "Using configured subscription: \${SUBSCRIPTION_ID}"
  elif [ "\${AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID:-}" = "true" ] && [ -n "\${AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID:-}" ]; then
    SUBSCRIPTION_ID="\${AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID}"
    echo "Reusing selected subscription: \${SUBSCRIPTION_ID}"
  else
    local all_subscriptions_json
    local subscriptions_json
    local subscription_count

    echo "Discovering enabled subscriptions..."
    all_subscriptions_json="$(az account list --query "[].{id:id,name:name,state:state,tenantId:tenantId,isDefault:isDefault}" -o json)"
    subscriptions_json="$(echo "\${all_subscriptions_json}" | jq '[.[] | select(.state == "Enabled")]')"
    subscription_count="$(echo "\${subscriptions_json}" | jq 'length')"

    if [ "\${subscription_count}" -eq 0 ]; then
      local diagnostic_account_email="\${ACCOUNT_EMAIL:-<empty>}"
      echo "Configured account email: \${diagnostic_account_email}"
      echo "Current Azure CLI account:"
      az account show --query "{subscriptionName:name, subscriptionId:id, tenantId:tenantId, state:state, user:user.name}" -o table 2>/dev/null || echo "No active Azure CLI account context is available."
      echo
      echo "Visible subscriptions:"
      if [ "$(echo "\${all_subscriptions_json}" | jq 'length')" -eq 0 ]; then
        echo "  None"
      else
        echo "\${all_subscriptions_json}" | jq -r 'to_entries[] | "  \(.key + 1)) \(.value.name // "<unnamed>") [\(.value.id // "-")] state=\(.value.state // "-") tenant=\(.value.tenantId // "-") default=\(.value.isDefault // false)"'
      fi
      if echo "\${all_subscriptions_json}" | jq -e 'any(.[]; .state == "Disabled")' >/dev/null; then
        echo
        echo "ERROR: Visible subscriptions exist but none are Enabled. Disabled subscriptions cannot deploy resources."
      fi
      echo "ERROR: No enabled subscriptions are visible to this identity."
      exit 1
    fi

    if [ "\${subscription_count}" -eq 1 ]; then
      SUBSCRIPTION_ID="$(echo "\${subscriptions_json}" | jq -r '.[0].id')"
      echo "Using the only enabled subscription: \${SUBSCRIPTION_ID}"
    else
      echo "Multiple enabled subscriptions found:"
      echo "\${subscriptions_json}" | jq -r 'to_entries[] | "\\(.key + 1)) \\(.value.name) [\\(.value.id)] tenant=\\(.value.tenantId)"'

      local selected_index
      while true; do
        read -r -p "Select subscription number: " selected_index
        if [[ "\${selected_index}" =~ ^[0-9]+$ ]] && [ "\${selected_index}" -ge 1 ] && [ "\${selected_index}" -le "\${subscription_count}" ]; then
          SUBSCRIPTION_ID="$(echo "\${subscriptions_json}" | jq -r --argjson index "$((selected_index - 1))" '.[$index].id')"
          break
        fi
        echo "Invalid selection. Enter a number from 1 to \${subscription_count}."
      done
    fi
  fi

  echo "Setting subscription: \${SUBSCRIPTION_ID}"
  if ! az account set --subscription "\${SUBSCRIPTION_ID}"; then
    echo "ERROR: Failed to set subscription."
    exit 1
  fi

  if [ "\${AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID:-}" = "true" ]; then
    export AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID="\${SUBSCRIPTION_ID}"
  fi
}

login_and_select_subscription

init_deployment_report() {
  if [ -n "\${AZURE_FOUNDRY_REPORT_PATH:-}" ]; then
    REPORT_PATH="\${AZURE_FOUNDRY_REPORT_PATH}"
    return 0
  fi

  local report_account
  report_account="$(printf "%s" "\${ACCOUNT_EMAIL:-\${ACCOUNT_NAME}}" | sed 's/[^A-Za-z0-9._@-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
  if [ -z "\${report_account}" ]; then
    report_account="\${ACCOUNT_NAME}"
  fi
  REPORT_PATH="\${SCRIPT_DIR}/foundry-deployment-result-\${report_account}-\${SUBSCRIPTION_ID}-\${REPORT_TIMESTAMP}.txt"
  export AZURE_FOUNDRY_REPORT_PATH="\${REPORT_PATH}"
  export AZURE_FOUNDRY_REPORT_TIMESTAMP="\${REPORT_TIMESTAMP}"
  {
    echo "Azure AI Foundry deployment result"
    echo "Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "Subscription ID: \${SUBSCRIPTION_ID}"
    echo
  } > "\${REPORT_PATH}"
  echo "Deployment result report: \${REPORT_PATH}"
}

init_deployment_report

echo "Current Azure account:"
az account show \\
  --query "{subscriptionName:name, subscriptionId:id, state:state, user:user.name}" \\
  -o table

# ============================================================
# Provider registration
# ============================================================
ensure_provider_registered() {
  local provider_state

  echo
  echo "Checking Microsoft.CognitiveServices provider registration..."

  provider_state="$(az provider show \\
    --namespace Microsoft.CognitiveServices \\
    --query "registrationState" \\
    -o tsv 2>/dev/null || echo "NotRegistered")"

  echo "Microsoft.CognitiveServices: \${provider_state}"

  if [ "\${provider_state}" = "Registered" ]; then
    return 0
  fi

  if [ "\${AUTO_REGISTER_PROVIDER}" != "true" ]; then
    echo "WARNING: Provider is not registered and AUTO_REGISTER_PROVIDER=false."
    return 1
  fi

  echo "Registering Microsoft.CognitiveServices..."
  if ! az provider register --namespace Microsoft.CognitiveServices; then
    echo "WARNING: Failed to start provider registration."
    echo "This usually means the current identity lacks subscription-level permission."
    return 1
  fi

  for attempt in $(seq 1 60); do
    provider_state="$(az provider show \\
      --namespace Microsoft.CognitiveServices \\
      --query "registrationState" \\
      -o tsv 2>/dev/null || echo "Unknown")"

    echo "  [\${attempt}/60] Microsoft.CognitiveServices: \${provider_state}"

    if [ "\${provider_state}" = "Registered" ]; then
      return 0
    fi

    sleep 10
  done

  echo "WARNING: Provider registration did not reach Registered in time."
  return 1
}

ensure_provider_registered || true

# ============================================================
# Resource and project setup
# ============================================================
ensure_resource_group() {
  echo
  echo "Ensuring resource group '\${RESOURCE_GROUP}'..."

  if az group show --name "\${RESOURCE_GROUP}" -o none 2>/dev/null; then
    echo "Resource group '\${RESOURCE_GROUP}' already exists. Skip create."
    return 0
  fi

  az group create \\
    --name "\${RESOURCE_GROUP}" \\
    --location "\${RESOURCE_GROUP_LOCATION}" \\
    -o none
}

ensure_foundry_account() {
  echo
  echo "Ensuring Azure AI Foundry resource '\${ACCOUNT_NAME}'..."

  local account_json
  if az cognitiveservices account show \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    -o none 2>/dev/null; then

    echo "Azure AI Foundry resource '\${ACCOUNT_NAME}' already exists. Skip create."
  else
    az cognitiveservices account create \\
      --name "\${ACCOUNT_NAME}" \\
      --resource-group "\${RESOURCE_GROUP}" \\
      --kind AIServices \\
      --sku s0 \\
      --location "\${ACCOUNT_LOCATION}" \\
      --allow-project-management \\
      -o none
  fi

  account_json="$(az cognitiveservices account show \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    -o json 2>/dev/null || true)"

  local existing_custom_domain
  existing_custom_domain="$(echo "\${account_json}" | jq -r '.properties.customSubDomainName // .properties.customSubdomainName // .customSubDomainName // ""' 2>/dev/null || true)"

  if [ -n "\${existing_custom_domain}" ]; then
    echo "Custom domain is already set to '\${existing_custom_domain}'. Skip custom domain update."
    return 0
  fi

  echo "Ensuring custom domain '\${ACCOUNT_NAME}'..."
  local custom_domain_error
  custom_domain_error="$(mktemp)"
  if az cognitiveservices account update \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --custom-domain "\${ACCOUNT_NAME}" \\
    -o none 2>"\${custom_domain_error}"; then
    rm -f "\${custom_domain_error}"
    return 0
  fi

  echo "WARNING: Could not set custom domain for '\${ACCOUNT_NAME}'."
  cat "\${custom_domain_error}" >&2
  rm -f "\${custom_domain_error}"
  echo "Skip Foundry project creation for this resource; model deployment will continue against the existing account."
  return 2
}

ensure_foundry_project() {
  echo
  echo "Ensuring Azure AI Foundry project '\${PROJECT_NAME}'..."

  if az cognitiveservices account project show \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --project-name "\${PROJECT_NAME}" \\
    -o none 2>/dev/null; then

    echo "Azure AI Foundry project '\${PROJECT_NAME}' already exists. Skip create."
    return 0
  fi

  local project_error
  project_error="$(mktemp)"
  if az cognitiveservices account project create \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --project-name "\${PROJECT_NAME}" \\
    --location "\${ACCOUNT_LOCATION}" \\
    -o none 2>"\${project_error}"; then
    rm -f "\${project_error}"
    return 0
  fi

  echo "WARNING: Could not create Foundry project '\${PROJECT_NAME}'."
  cat "\${project_error}" >&2
  rm -f "\${project_error}"
  echo "Skip project creation and continue."
  return 2
}

echo
echo "Account location: \${ACCOUNT_LOCATION}"
echo "Project name:     \${PROJECT_NAME}"

BASE_URL="https://management.azure.com/subscriptions/\${SUBSCRIPTION_ID}/resourceGroups/\${RESOURCE_GROUP}/providers/Microsoft.CognitiveServices/accounts/\${ACCOUNT_NAME}/deployments"
CAPACITY_URL="https://management.azure.com/subscriptions/\${SUBSCRIPTION_ID}/providers/Microsoft.CognitiveServices/locations/\${ACCOUNT_LOCATION}/modelCapacities"

# ============================================================
# Model list
# Format:
# deploymentName|modelFormat|modelName|version|maxCapacity
# ============================================================
MODELS=(
${modelRows}
)

# ============================================================
# Helper functions
# ============================================================
deployment_exists() {
  local deployment_name="$1"

  az cognitiveservices account deployment show \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --deployment-name "\${deployment_name}" \\
    -o none >/dev/null 2>&1
}

get_deployment_state() {
  local deployment_name="$1"

  az rest \\
    --method get \\
    --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    --query "properties.provisioningState" \\
    -o tsv 2>/dev/null || true
}

get_existing_capacity_if_same_model() {
  local deployment_name="$1"
  local model_format="$2"
  local model_name="$3"
  local model_version="$4"
  local sku_name="$5"

  local deployment_json
  deployment_json="$(az rest \\
    --method get \\
    --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    -o json 2>/dev/null || true)"

  if [ -z "\${deployment_json}" ]; then
    echo "0"
    return 0
  fi

  echo "\${deployment_json}" | jq -r \\
    --arg fmt "\${model_format}" \\
    --arg model "\${model_name}" \\
    --arg ver "\${model_version}" \\
    --arg sku "\${sku_name}" '
      if
        (.properties.model.format == $fmt) and
        (.properties.model.name == $model) and
        (.properties.model.version == $ver) and
        (.sku.name == $sku)
      then
        (.sku.capacity // .properties.currentCapacity // 0)
      else
        0
      end
    ' 2>/dev/null || echo "0"
}

get_existing_deployment_if_same_model() {
  local deployment_name="$1"
  local model_format="$2"
  local model_name="$3"
  local model_version="$4"

  local deployment_json
  deployment_json="$(az rest \\
    --method get \\
    --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    -o json 2>/dev/null || true)"

  if [ -z "\${deployment_json}" ]; then
    return 0
  fi

  echo "\${deployment_json}" | jq -r \\
    --arg fmt "\${model_format}" \\
    --arg model "\${model_name}" \\
    --arg ver "\${model_version}" '
      if
        (.properties.model.format == $fmt) and
        (.properties.model.name == $model) and
        (.properties.model.version == $ver)
      then
        [(.sku.name // ""), ((.sku.capacity // .properties.currentCapacity // 0) | tostring)] | @tsv
      else
        empty
      end
    ' 2>/dev/null || true
}

get_available_capacity() {
  local model_format="$1"
  local model_name="$2"
  local model_version="$3"
  local sku_name="$4"

  local capacity_json
  local capacity_error
  capacity_error="$(mktemp)"
  if ! capacity_json="$(az rest \\
    --method get \\
    --url "\${CAPACITY_URL}?api-version=\${CAPACITY_API_VERSION}&modelFormat=\${model_format}&modelName=\${model_name}&modelVersion=\${model_version}" \\
    -o json 2>"\${capacity_error}")"; then
    echo "ERROR: Capacity API query failed for \${model_name} \${model_version}." >&2
    cat "\${capacity_error}" >&2
    rm -f "\${capacity_error}"
    return 1
  fi
  rm -f "\${capacity_error}"

  echo "\${capacity_json}" | jq -r \\
    --arg location "\${ACCOUNT_LOCATION}" \\
    --arg sku "\${sku_name}" '
      [
        .value[]
        | select((((.location // .properties.location // $location) | ascii_downcase) == ($location | ascii_downcase)))
        | select(((.properties.skuName // .sku.name // .skuName // .name // "") | ascii_downcase) == ($sku | ascii_downcase))
        | (.properties.availableCapacity // .availableCapacity // 0)
      ]
      | map(tonumber? // 0)
      | if length == 0 then empty else max | floor end
    '
}

select_global_standard_capacity() {
  local model_format="$1"
  local model_name="$2"
  local model_version="$3"

  local capacity
  capacity="$(get_available_capacity "\${model_format}" "\${model_name}" "\${model_version}" "\${SKU_NAME}")"
  local rc=$?

  if [ "\${rc}" -ne 0 ]; then
    return "\${rc}"
  fi
  if [ -z "\${capacity}" ]; then
    return 2
  fi
  if ! [[ "\${capacity}" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid available capacity value for SKU \${SKU_NAME}: \${capacity}"
    return 1
  fi

  echo "GlobalStandard availableCapacity=\${capacity}" >&2
  echo "\${SKU_NAME}|\${capacity}"
}

print_capacity_debug() {
  local model_format="$1"
  local model_name="$2"
  local model_version="$3"

  echo "Capacity rows returned by modelCapacities API:"

  az rest \\
    --method get \\
    --url "\${CAPACITY_URL}?api-version=\${CAPACITY_API_VERSION}&modelFormat=\${model_format}&modelName=\${model_name}&modelVersion=\${model_version}" \\
    --query "value[].{
      location:location,
      propertiesLocation:properties.location,
      sku:properties.skuName,
      skuName:sku.name,
      topSkuName:skuName,
      name:name,
      availableCapacity:properties.availableCapacity,
      topAvailableCapacity:availableCapacity,
      modelName:properties.model.name,
      modelVersion:properties.model.version
    }" \\
    -o table 2>/dev/null || true
}

print_copyable_model_import_list() {
  local model_list

  echo
  echo "============================================================"
  echo "Copyable model import list"
  echo "============================================================"
  echo "Copy this comma-separated list into the model list import field:"

  if ! model_list="$(az rest \\
    --method get \\
    --url "\${BASE_URL}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    -o json 2>/dev/null | jq -r '
      [
        .value[]?
        | select(((.properties.provisioningState // "") | ascii_downcase) == "succeeded")
        | [(.properties.model.name // ""), (.name // "")]
        | .[]
        | select(. != "")
      ]
      | reduce .[] as $name ([]; if index($name) then . else . + [$name] end)
      | join(", ")
    ')"; then
    echo "WARNING: Could not generate copyable model import list."
    return 0
  fi

  if [ -z "\${model_list}" ]; then
    echo "No succeeded deployments found."
    return 0
  fi

  echo "\${model_list}"
}

print_account_key_summary() {
  local key1
  key1="$(az cognitiveservices account keys list \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --query "key1" \\
    -o tsv 2>/dev/null || true)"

  echo
  echo "============================================================"
  echo "Account access summary"
  echo "============================================================"
  echo "Subscription ID:  \${SUBSCRIPTION_ID}"
  echo "Region:           \${ACCOUNT_LOCATION}"
  echo "Resource name:    \${ACCOUNT_NAME}"
  echo "Foundry endpoint: https://\${ACCOUNT_NAME}.services.ai.azure.com/api/projects/\${PROJECT_NAME}"
  echo "OpenAI endpoint:  https://\${ACCOUNT_NAME}.openai.azure.com"
  echo "Key1:             \${key1}"
}

append_deployment_report() {
  local key1
  local deployments_json
  local payload
  key1="$(az cognitiveservices account keys list \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --query "key1" \\
    -o tsv 2>/dev/null || true)"

  deployments_json="$(az rest \\
    --method get \\
    --url "\${BASE_URL}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    -o json 2>/dev/null | jq -c '
      [
        .value[]?
        | {
            deploymentName: (.name // ""),
            modelName: (.properties.model.name // ""),
            modelVersion: (.properties.model.version // ""),
            sku: (.sku.name // ""),
            capacity: (.sku.capacity // 0),
            state: (.properties.provisioningState // ""),
            raiPolicy: (.properties.raiPolicyName // "")
          }
      ]
    ' 2>/dev/null || echo '[]')"

  payload="$(jq -n \\
    --arg subscriptionId "\${SUBSCRIPTION_ID}" \\
    --arg region "\${ACCOUNT_LOCATION}" \\
    --arg resourceName "\${ACCOUNT_NAME}" \\
    --arg foundryProjectEndpoint "https://\${ACCOUNT_NAME}.services.ai.azure.com/api/projects/\${PROJECT_NAME}" \\
    --arg openaiEndpoint "https://\${ACCOUNT_NAME}.openai.azure.com" \\
    --arg aiServicesEndpoint "https://\${ACCOUNT_NAME}.services.ai.azure.com" \\
    --arg apiKey "\${key1}" \\
    --argjson deployments "\${deployments_json:-[]}" '{
      schema: "ai-foundry-manager.deployment-result.v1",
      subscriptionId: $subscriptionId,
      regions: [
        {
          region: $region,
          resourceName: $resourceName,
          foundryProjectEndpoint: $foundryProjectEndpoint,
          openaiEndpoint: $openaiEndpoint,
          aiServicesEndpoint: $aiServicesEndpoint,
          apiKey: $apiKey,
          deployments: $deployments
        }
      ]
    }')"

  {
    echo
    echo "============================================================"
    echo "Account access summary"
    echo "============================================================"
    echo "Subscription ID:  \${SUBSCRIPTION_ID}"
    echo "Region:           \${ACCOUNT_LOCATION}"
    echo "Resource name:    \${ACCOUNT_NAME}"
    echo "Foundry endpoint: https://\${ACCOUNT_NAME}.services.ai.azure.com/api/projects/\${PROJECT_NAME}"
    echo "OpenAI endpoint:  https://\${ACCOUNT_NAME}.openai.azure.com"
    echo "Key1:             \${key1}"
    echo
    echo "Final deployments under account '\${ACCOUNT_NAME}'"
    echo "\${deployments_json}" | jq -r '
      if length == 0 then
        "No deployments found."
      else
        .[]
        | "  - \\(.deploymentName) | \\(.modelName) | \\(.modelVersion) | \\(.sku) | capacity=\\(.capacity) | state=\\(.state) | raiPolicy=\\(.raiPolicy)"
      end
    '
    echo
    echo "AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN"
    echo "\${payload}"
    echo "AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END"
  } >> "\${REPORT_PATH}"
}

prepare_account_resources() {
  ensure_resource_group
  local account_rc=0
  ensure_foundry_account || account_rc=$?
  if [ "\${account_rc}" -eq 0 ]; then
    ensure_foundry_project || true
  else
    echo "Skip Foundry project creation because custom domain is not ready."
  fi
  print_account_key_summary
}

wait_until_succeeded() {
  local deployment_name="$1"
  local max_attempts="\${2:-120}"
  local sleep_seconds="\${3:-10}"

  echo "Waiting for '\${deployment_name}' to reach Succeeded..."

  for attempt in $(seq 1 "\${max_attempts}"); do
    local state
    state="$(get_deployment_state "\${deployment_name}")"

    echo "  [\${attempt}/\${max_attempts}] \${deployment_name}: \${state:-Unknown}"

    case "\${state}" in
      Succeeded)
        echo "Deployment '\${deployment_name}' succeeded."
        return 0
        ;;
      Failed|Canceled|Cancelled)
        echo "ERROR: Deployment '\${deployment_name}' ended with state: \${state}"
        az rest \\
          --method get \\
          --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
          -o jsonc 2>/dev/null || true
        return 1
        ;;
      *)
        sleep "\${sleep_seconds}"
        ;;
    esac
  done

  echo "ERROR: Timed out waiting for '\${deployment_name}' to reach Succeeded."
  az rest \\
    --method get \\
    --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    -o jsonc 2>/dev/null || true

  return 1
}

deploy_model_with_max_capacity() {
  local deployment_name="$1"
  local model_format="$2"
  local model_name="$3"
  local model_version="$4"
  local configured_max_capacity="\${5:-0}"

  echo
  echo "============================================================"
  echo "Deployment name: \${deployment_name}"
  echo "Model format:    \${model_format}"
  echo "Model name:      \${model_name}"
  echo "Model version:   \${model_version}"
  echo "SKU:             \${SKU_NAME}"
  echo "Region:          \${ACCOUNT_LOCATION}"
  echo "============================================================"

  local deployment_already_exists="false"
  if deployment_exists "\${deployment_name}"; then
    deployment_already_exists="true"
    echo "Deployment '\${deployment_name}' already exists."

    if [ "\${OVERWRITE_EXISTING}" != "true" ]; then
      echo "Skip '\${deployment_name}' because OVERWRITE_EXISTING=false."
      return 2
    fi

    echo "OVERWRITE_EXISTING=true, this deployment may be updated."
  fi

  local selected_sku
  local available_capacity
  local existing_same_model_capacity="0"
  local force_configured_capacity="false"

  if [ "\${deployment_already_exists}" = "true" ]; then
    local existing_same_model
    existing_same_model="$(get_existing_deployment_if_same_model "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}")"
    if [ -n "\${existing_same_model}" ]; then
      IFS=$'\\t' read -r selected_sku existing_same_model_capacity <<< "\${existing_same_model}"
      if [ "\${selected_sku}" = "\${SKU_NAME}" ]; then
        echo "Existing same-model deployment uses SKU '\${selected_sku}', preserving this SKU."
        available_capacity="$(get_available_capacity "\${model_format}" "\${model_name}" "\${model_version}" "\${SKU_NAME}")"
        capacity_rc=$?
        if [ "\${capacity_rc}" -ne 0 ]; then
          echo "ERROR: Failed to query available capacity for \${SKU_NAME}."
          print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
          return 1
        fi
        if [ -z "\${available_capacity}" ]; then
          available_capacity="0"
        fi
      else
        echo "Existing same-model deployment uses SKU '\${selected_sku}', but this script only deploys \${SKU_NAME}."
        echo "Will force redeploy to \${SKU_NAME} using configured max capacity."
        selected_sku="\${SKU_NAME}"
        available_capacity="0"
        existing_same_model_capacity="0"
        force_configured_capacity="true"
      fi
    fi
  fi

  if [ -z "\${selected_sku:-}" ]; then
    local selected_sku_capacity
    selected_sku_capacity="$(select_global_standard_capacity "\${model_format}" "\${model_name}" "\${model_version}")"
    local capacity_rc=$?

    if [ "\${capacity_rc}" -ne 0 ]; then
      if [ "\${capacity_rc}" -eq 2 ]; then
        echo "WARNING: No \${SKU_NAME} availableCapacity found in \${ACCOUNT_LOCATION}."
        print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
        echo "Skip '\${deployment_name}'."
        return 2
      fi
      echo "ERROR: Failed to query available capacity for \${model_name} \${model_version}."
      print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
      return 1
    fi

    IFS='|' read -r selected_sku available_capacity <<< "\${selected_sku_capacity}"
    existing_same_model_capacity="$(get_existing_capacity_if_same_model "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}" "\${selected_sku}")"
  fi

  if ! [[ "\${available_capacity}" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid available capacity value: \${available_capacity}"
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 1
  fi

  if ! [[ "\${existing_same_model_capacity}" =~ ^[0-9]+$ ]]; then
    echo "WARNING: Invalid existing capacity value '\${existing_same_model_capacity}', assume 0."
    existing_same_model_capacity="0"
  fi

  local target_capacity
  # Azure reports availableCapacity after existing deployments consume quota.
  # When overwriting the same model deployment, add its current capacity back
  # so a fully allocated quota does not collapse the deployment to 0.
  target_capacity=$((available_capacity + existing_same_model_capacity))
  if [ "\${force_configured_capacity}" = "true" ]; then
    if ! [[ "\${configured_max_capacity}" =~ ^[0-9]+$ ]]; then
      configured_max_capacity="0"
    fi
    if [ "\${configured_max_capacity}" -gt "\${target_capacity}" ]; then
      echo "Force GlobalStandard target capacity from configured max capacity: \${configured_max_capacity}"
      target_capacity="\${configured_max_capacity}"
    fi
  fi

  if [ "\${target_capacity}" -le 0 ]; then
    echo "WARNING: Max deployable capacity is \${target_capacity}; skip '\${deployment_name}'."
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 2
  fi

  echo "Available capacity:            \${available_capacity}"
  echo "Selected SKU:                  \${selected_sku}"
  echo "Used quota from existing deployment: \${existing_same_model_capacity}"
  echo "Target deployment capacity:    \${target_capacity}"
  echo "Creating or updating deployment '\${deployment_name}'..."

  local deployment_payload
  deployment_payload="$(jq -n \\
    --arg model_format "\${model_format}" \\
    --arg model_name "\${model_name}" \\
    --arg model_version "\${model_version}" \\
    --arg version_upgrade_option "\${VERSION_UPGRADE_OPTION}" \\
    --arg rai_policy_name "\${RAI_POLICY_NAME}" \\
    --arg sku_name "\${selected_sku}" \\
    --argjson sku_capacity "\${target_capacity}" '{
      properties: {
        model: {
          format: $model_format,
          name: $model_name,
          version: $model_version
        },
        versionUpgradeOption: $version_upgrade_option,
        raiPolicyName: $rai_policy_name
      },
      sku: {
        name: $sku_name,
        capacity: $sku_capacity
      }
    }')"

  if ! az rest \\
    --method put \\
    --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    --headers "Content-Type=application/json" \\
    --body "\${deployment_payload}" \\
    -o jsonc; then

    echo "ERROR: Azure CLI deployment PUT failed for '\${deployment_name}'."
    echo "Skip to next deployment."
    return 1
  fi

  if ! wait_until_succeeded "\${deployment_name}"; then
    echo "ERROR: Deployment '\${deployment_name}' did not reach Succeeded."
    echo "Skip to next deployment."
    return 1
  fi

  return 0
}

deploy_all_models() {
  # ============================================================
  # Main deployment loop
  # ============================================================
  for item in "\${MODELS[@]}"; do
    IFS='|' read -r deployment_name model_format model_name model_version configured_max_capacity <<< "\${item}"

    deploy_model_with_max_capacity "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}" "\${configured_max_capacity:-0}"
    rc=$?

    case "\${rc}" in
      0)
        echo "SUCCESS: \${deployment_name}"
        SUCCEEDED_DEPLOYMENTS+=("\${deployment_name}")
        ;;
      2)
        echo "SKIPPED: \${deployment_name}"
        SKIPPED_DEPLOYMENTS+=("\${deployment_name}")
        ;;
      *)
        echo "FAILED: \${deployment_name}"
        FAILED_DEPLOYMENTS+=("\${deployment_name}")
        ;;
    esac

    echo "Continue to next deployment..."
  done
}

print_deployment_summary() {
  # ============================================================
  # Summary
  # ============================================================
  echo
  echo "============================================================"
  echo "Deployment summary"
  echo "============================================================"

  echo "Succeeded: \${#SUCCEEDED_DEPLOYMENTS[@]}"
  for name in "\${SUCCEEDED_DEPLOYMENTS[@]}"; do
    echo "  OK      \${name}"
  done

  echo
  echo "Skipped: \${#SKIPPED_DEPLOYMENTS[@]}"
  for name in "\${SKIPPED_DEPLOYMENTS[@]}"; do
    echo "  SKIP    \${name}"
  done

  echo
  echo "Failed: \${#FAILED_DEPLOYMENTS[@]}"
  for name in "\${FAILED_DEPLOYMENTS[@]}"; do
    echo "  FAIL    \${name}"
  done
}

print_final_deployments() {
  # ============================================================
  # Final deployment list
  # ============================================================
  echo
  echo "============================================================"
  echo "Final deployments under account '\${ACCOUNT_NAME}'"
  echo "============================================================"

  az rest \\
    --method get \\
    --url "\${BASE_URL}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    --query "value[].{
      deploymentName:name,
      modelName:properties.model.name,
      modelVersion:properties.model.version,
      sku:sku.name,
      capacity:sku.capacity,
      state:properties.provisioningState,
      raiPolicy:properties.raiPolicyName
    }" \\
    -o table 2>/dev/null || true
}

if [ "\${DEPLOYMENT_RUN_MODE}" != "deploy-only" ]; then
  prepare_account_resources
fi

if [ "\${DEPLOYMENT_RUN_MODE}" != "prepare-only" ]; then
  deploy_all_models
  print_deployment_summary
  print_final_deployments
fi

print_copyable_model_import_list
print_account_key_summary
append_deployment_report
echo "Deployment result report: \${REPORT_PATH}"
`;
}

export function buildAzureCliDeploymentScript(
  input: AzureCliDeploymentInput
): string {
  const validation = validateAzureCliDeploymentInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const identity = deriveIdentity(input);
  if (!identity) {
    throw new Error('Unable to derive Azure CLI deployment identity');
  }

  return buildAzureCliDeploymentScriptBody(
    identity,
    stringifyAzureCliModelRows(input.models),
    input.servicePrincipal,
    input.accountEmail,
    input.overwriteExisting
  );
}

export function buildAzureCliMultiRegionDeploymentScript(
  input: AzureCliMultiRegionDeploymentInput
): string {
  const subscriptionId = input.subscriptionId?.trim() || '';
  const resourceGroupName = input.resourceGroupName.trim();
  const targets = input.targets.filter((target) => target.models.length > 0);

  if (!resourceGroupName) {
    throw new Error('resourceGroupName is required');
  }
  if (targets.length === 0) {
    throw new Error('targets are required');
  }

  return [
    'unset AZURE_FOUNDRY_REPORT_PATH',
    'unset AZURE_FOUNDRY_REPORT_TIMESTAMP',
    'unset AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID',
    'export AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID="true"',
    '# ============================================================',
    '# Prepare all selected regions first',
    '# ============================================================',
    ...targets.map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliDeploymentScript({
        subscriptionId,
        servicePrincipal: input.servicePrincipal,
        accountEmail: input.accountEmail,
        resourceGroupName,
        resourceName: target.resourceName,
        location: target.location,
        foundryProjectEndpoint: target.foundryProjectEndpoint,
        models: target.models,
        overwriteExisting: input.overwriteExisting,
      });

      return [
        `# ============================================================`,
        `# Prepare ${shellDoubleQuote(label)}`,
        `# ============================================================`,
        'export AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE="prepare-only"',
        script,
      ].join('\n');
    }),
    '# ============================================================',
    '# Deploy models after all selected regions are prepared',
    '# ============================================================',
    ...targets.map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliDeploymentScript({
        subscriptionId,
        servicePrincipal: input.servicePrincipal,
        accountEmail: input.accountEmail,
        resourceGroupName,
        resourceName: target.resourceName,
        location: target.location,
        foundryProjectEndpoint: target.foundryProjectEndpoint,
        models: target.models,
        overwriteExisting: input.overwriteExisting,
      });

      return [
        `# ============================================================`,
        `# Deploy ${shellDoubleQuote(label)}`,
        `# ============================================================`,
        'export AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE="deploy-only"',
        script,
      ].join('\n');
    }),
    'unset AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE',
    'unset AZURE_FOUNDRY_REPORT_PATH',
    'unset AZURE_FOUNDRY_REPORT_TIMESTAMP',
    'unset AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID',
    'unset AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID',
    'unset AZURE_CONFIG_DIR',
  ].join('\n\n');
}

function stringifyPowerShellModelRows(models: AzureCliDeploymentModel[]): string {
  return models
    .map(
      (model) =>
        `  '${powershellSingleQuote(model.deploymentName.trim())}|${powershellSingleQuote(
          model.modelFormat.trim()
        )}|${powershellSingleQuote(model.modelName.trim())}|${powershellSingleQuote(
          model.version.trim()
        )}|${Math.max(0, Math.floor(model.capacity ?? 0))}'`
    )
    .join(',\n');
}

function buildAzureCliPowerShellDeploymentScriptBody(
  identity: AzureCliDeploymentIdentity,
  modelRows: string,
  servicePrincipal?: AzureCliServicePrincipal,
  accountEmail = '',
  overwriteExisting = true
): string {
  const overwriteDefault = overwriteExisting ? 'true' : 'false';
  return `# Deployment method: save as deploy-foundry.ps1, then run:
# ${AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND.split('\n').join('\n# ')}

# Azure CLI writes expected "not found" checks to stderr. Keep native command
# failures non-terminating and handle them explicitly through $LASTEXITCODE.
$ErrorActionPreference = 'Continue'

# ============================================================
# Basic configuration
# ============================================================
$ConfiguredSubscriptionId = '${powershellSingleQuote(identity.subscriptionId)}'
$SubscriptionId = $ConfiguredSubscriptionId
$SpAppId = '${powershellSingleQuote(servicePrincipal?.appId || '')}'
$SpPassword = '${powershellSingleQuote(servicePrincipal?.password || '')}'
$SpTenant = '${powershellSingleQuote(servicePrincipal?.tenant || '')}'
$AccountEmail = '${powershellSingleQuote(accountEmail)}'
$ResourceGroup = '${powershellSingleQuote(identity.resourceGroup)}'
$ResourceGroupLocation = '${powershellSingleQuote(identity.location)}'
$AccountName = '${powershellSingleQuote(identity.accountName)}'
$AccountLocation = '${powershellSingleQuote(identity.location)}'
$ProjectName = '${powershellSingleQuote(identity.projectId)}'
$DeploymentApiVersion = '2025-09-01'
$CapacityApiVersion = '2025-06-01'
$RaiPolicyName = 'Microsoft.Nil'
$VersionUpgradeOption = 'OnceNewDefaultVersionAvailable'
$SkuName = 'GlobalStandard'
$OverwriteExisting = if ($env:OVERWRITE_EXISTING) { $env:OVERWRITE_EXISTING } else { '${overwriteDefault}' }
$AutoRegisterProvider = if ($env:AUTO_REGISTER_PROVIDER) { $env:AUTO_REGISTER_PROVIDER } else { 'true' }
$DeploymentRunMode = if ($env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE) { $env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE } else { 'all' }
$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$AzureConfigDir = if ($env:AZURE_CONFIG_DIR) { $env:AZURE_CONFIG_DIR } else { Join-Path $ScriptDir '.azure-cli-profile' }
$env:AZURE_CONFIG_DIR = $AzureConfigDir
New-Item -ItemType Directory -Force -Path $AzureConfigDir | Out-Null
$ReportTimestamp = if ($env:AZURE_FOUNDRY_REPORT_TIMESTAMP) { $env:AZURE_FOUNDRY_REPORT_TIMESTAMP } else { Get-Date -Format 'yyyyMMdd-HHmmss' }

$SucceededDeployments = @()
$SkippedDeployments = @()
$FailedDeployments = @()

function Refresh-AzureCliPath {
  $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
  $candidatePaths = @(
    "$env:ProgramFiles\\Microsoft SDKs\\Azure\\CLI2\\wbin",
    "$programFilesX86\\Microsoft SDKs\\Azure\\CLI2\\wbin",
    "$env:LocalAppData\\Programs\\Azure CLI\\wbin"
  ) | Where-Object { $_ -and (Test-Path $_) }

  foreach ($candidatePath in $candidatePaths) {
    if (($env:Path -split ';') -notcontains $candidatePath) {
      $env:Path = "$candidatePath;$env:Path"
    }
  }
}

function Ensure-AzureCli {
  Refresh-AzureCliPath
  if (Get-Command az -ErrorAction SilentlyContinue) {
    return
  }

  Write-Host 'Azure CLI was not found. Attempting automatic installation with winget...'
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI is required, and winget was not found. Install Azure CLI from https://learn.microsoft.com/cli/azure/install-azure-cli-windows, then rerun this script.'
  }

  & winget install -e --id Microsoft.AzureCLI --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw 'Azure CLI installation with winget failed. Install Azure CLI manually, then rerun this script.'
  }

  Refresh-AzureCliPath
  if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI installed, but az is still not on PATH. Open a new PowerShell window and rerun this script.'
  }
}

Ensure-AzureCli

function Invoke-AzCliJson {
  param(
    [Parameter(Mandatory=$true)][string[]]$Arguments,
    [switch]$QuietOnError
  )
  $safeArguments = @($Arguments | ForEach-Object { ConvertTo-AzureCliArgument -Value $_ })
  $stderrPath = Join-Path ([System.IO.Path]::GetTempPath()) ('az-stderr-' + [System.Guid]::NewGuid().ToString('N') + '.txt')
  $output = $null
  $stderr = @()
  try {
    $output = (& az @safeArguments 2> $stderrPath)
    $exitCode = $LASTEXITCODE
    if (Test-Path $stderrPath) {
      $stderr = Get-Content -LiteralPath $stderrPath -ErrorAction SilentlyContinue
    }
  } finally {
    Remove-Item -LiteralPath $stderrPath -Force -ErrorAction SilentlyContinue
  }

  if ($exitCode -ne 0) {
    if (-not $QuietOnError) {
      Write-Warning ('Azure CLI command failed: az ' + ($Arguments -join ' '))
      if ($output) {
        $output | ForEach-Object { Write-Warning $_ }
      }
      if ($stderr) {
        $stderr | ForEach-Object { Write-Warning $_ }
      }
    }
    return $null
  }
  if (-not $output) {
    return $null
  }
  $jsonText = (($output | Out-String).Trim())
  $jsonStart = $jsonText.IndexOf('{')
  $arrayStart = $jsonText.IndexOf('[')
  if ($jsonStart -lt 0 -or ($arrayStart -ge 0 -and $arrayStart -lt $jsonStart)) {
    $jsonStart = $arrayStart
  }
  if ($jsonStart -gt 0) {
    $jsonText = $jsonText.Substring($jsonStart)
  }
  try {
    return ($jsonText | ConvertFrom-Json)
  } catch {
    if (-not $QuietOnError) {
      Write-Warning ('Azure CLI returned non-JSON output for: az ' + ($Arguments -join ' '))
      if ($stderr) {
        $stderr | ForEach-Object { Write-Warning $_ }
      }
      if ($output) {
        $output | ForEach-Object { Write-Warning $_ }
      }
    }
    return $null
  }
}

function ConvertTo-AzureCliArgument {
  param([Parameter(Mandatory=$true)][string]$Value)
  if ($Value -like '*&*') {
    return ('"' + ($Value -replace '"', '\\"') + '"')
  }
  return $Value
}

function Invoke-AzureCli {
  param([Parameter(Mandatory=$true)][string[]]$Arguments)
  $safeArguments = @($Arguments | ForEach-Object { ConvertTo-AzureCliArgument -Value $_ })
  return (& az @safeArguments 2>&1)
}

function Invoke-AzureCliQuiet {
  param([Parameter(Mandatory=$true)][string[]]$Arguments)
  $safeArguments = @($Arguments | ForEach-Object { ConvertTo-AzureCliArgument -Value $_ })
  & az @safeArguments 2>$null
}

function Login-AndSelectSubscription {
  if ($SpAppId -or $SpPassword -or $SpTenant) {
    if (-not $SpAppId -or -not $SpPassword -or -not $SpTenant) {
      throw 'Service Principal requires appId, password, and tenant.'
    }

    Write-Host 'Logging in with Service Principal...'
    & az login --service-principal --username $SpAppId --password $SpPassword --tenant $SpTenant -o none
    if ($LASTEXITCODE -ne 0) {
      throw 'Service Principal login failed.'
    }
  }

  if ($ConfiguredSubscriptionId) {
    $script:SubscriptionId = $ConfiguredSubscriptionId
    Write-Host "Using configured subscription: $script:SubscriptionId"
  } elseif ($env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID -eq 'true' -and $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID) {
    $script:SubscriptionId = $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID
    Write-Host "Reusing selected subscription: $script:SubscriptionId"
  } else {
    Write-Host 'Discovering enabled subscriptions...'
    $allSubscriptions = Invoke-AzCliJson -Arguments @('account','list','--query',"[].{id:id,name:name,state:state,tenantId:tenantId,isDefault:isDefault}",'-o','json')
    if (-not $allSubscriptions) {
      $allSubscriptions = @()
    }
    if ($allSubscriptions -isnot [array]) {
      $allSubscriptions = @($allSubscriptions)
    }
    $subscriptions = @($allSubscriptions | Where-Object { $_.state -eq 'Enabled' })

    if ($subscriptions.Count -eq 0) {
      $diagnosticAccountEmail = if ($AccountEmail) { $AccountEmail } else { '<empty>' }
      Write-Host "Configured account email: $diagnosticAccountEmail"
      Write-Host 'Current Azure CLI account:'
      Invoke-AzureCliQuiet -Arguments @('account','show','--query','{subscriptionName:name, subscriptionId:id, tenantId:tenantId, state:state, user:user.name}','-o','table')
      if ($LASTEXITCODE -ne 0) {
        Write-Host 'No active Azure CLI account context is available.'
      }
      Write-Host ''
      Write-Host 'Visible subscriptions:'
      if ($allSubscriptions.Count -eq 0) {
        Write-Host '  None'
      } else {
        for ($i = 0; $i -lt $allSubscriptions.Count; $i++) {
          $n = $i + 1
          $item = $allSubscriptions[$i]
          Write-Host "$n) $($item.name) [$($item.id)] state=$($item.state) tenant=$($item.tenantId) default=$($item.isDefault)"
        }
      }
      if (@($allSubscriptions | Where-Object { $_.state -eq 'Disabled' }).Count -gt 0) {
        Write-Host ''
        Write-Host 'ERROR: Visible subscriptions exist but none are Enabled. Disabled subscriptions cannot deploy resources.'
      }
      throw 'No enabled subscriptions are visible to this identity.'
    } elseif ($subscriptions.Count -eq 1) {
      $script:SubscriptionId = $subscriptions[0].id
      Write-Host "Using the only enabled subscription: $script:SubscriptionId"
    } else {
      Write-Host 'Multiple enabled subscriptions found:'
      for ($i = 0; $i -lt $subscriptions.Count; $i++) {
        $n = $i + 1
        Write-Host "$n) $($subscriptions[$i].name) [$($subscriptions[$i].id)] tenant=$($subscriptions[$i].tenantId)"
      }
      $selected = 0
      $ok = $false
      do {
        $raw = Read-Host 'Select subscription number'
        $ok = [int]::TryParse($raw, [ref]$selected)
      } until ($ok -and $selected -ge 1 -and $selected -le $subscriptions.Count)
      $script:SubscriptionId = $subscriptions[$selected - 1].id
    }
  }

  Write-Host "Setting subscription: $script:SubscriptionId"
  & az account set --subscription $script:SubscriptionId
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to set subscription.'
  }
  if ($env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID -eq 'true') {
    $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID = $script:SubscriptionId
  }
}

function Ensure-ProviderRegistered {
  Write-Host ''
  Write-Host 'Checking Microsoft.CognitiveServices provider registration...'
  $providerState = (& az provider show --namespace Microsoft.CognitiveServices --query registrationState -o tsv 2>$null)
  if (-not $providerState) { $providerState = 'NotRegistered' }
  Write-Host "Microsoft.CognitiveServices: $providerState"
  if ($providerState -eq 'Registered') { return }
  if ($AutoRegisterProvider -ne 'true') {
    Write-Warning 'Provider is not registered and AUTO_REGISTER_PROVIDER is not true.'
    return
  }
  & az provider register --namespace Microsoft.CognitiveServices
  if ($LASTEXITCODE -ne 0) {
    Write-Warning 'Failed to start provider registration.'
    return
  }
  for ($attempt = 1; $attempt -le 60; $attempt++) {
    $providerState = (& az provider show --namespace Microsoft.CognitiveServices --query registrationState -o tsv 2>$null)
    Write-Host "  [$attempt/60] Microsoft.CognitiveServices: $providerState"
    if ($providerState -eq 'Registered') { return }
    Start-Sleep -Seconds 10
  }
  Write-Warning 'Provider registration did not reach Registered in time.'
}

function Ensure-ResourceGroup {
  Write-Host ''
  Write-Host "Ensuring resource group '$ResourceGroup'..."
  & az group show --name $ResourceGroup -o none 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Resource group '$ResourceGroup' already exists. Skip create."
    return
  }
  & az group create --name $ResourceGroup --location $ResourceGroupLocation -o none
}

function Ensure-FoundryAccount {
  Write-Host ''
  Write-Host "Ensuring Azure AI Foundry resource '$AccountName'..."
  $account = Invoke-AzCliJson -Arguments @('cognitiveservices','account','show','--name',$AccountName,'--resource-group',$ResourceGroup,'-o','json') -QuietOnError
  if ($account) {
    Write-Host "Azure AI Foundry resource '$AccountName' already exists. Skip create."
  } else {
    & az cognitiveservices account create --name $AccountName --resource-group $ResourceGroup --kind AIServices --sku s0 --location $AccountLocation --allow-project-management -o none
    $account = Invoke-AzCliJson -Arguments @('cognitiveservices','account','show','--name',$AccountName,'--resource-group',$ResourceGroup,'-o','json') -QuietOnError
  }

  $existingCustomDomain = ''
  if ($account -and $account.properties) {
    if ($account.properties.customSubDomainName) {
      $existingCustomDomain = $account.properties.customSubDomainName
    } elseif ($account.properties.customSubdomainName) {
      $existingCustomDomain = $account.properties.customSubdomainName
    }
  }

  if ($existingCustomDomain) {
    Write-Host "Custom domain is already set to '$existingCustomDomain'. Skip custom domain update."
    return $true
  }

  Write-Host "Ensuring custom domain '$AccountName'..."
  $output = Invoke-AzureCli -Arguments @('cognitiveservices','account','update','--name',$AccountName,'--resource-group',$ResourceGroup,'--custom-domain',$AccountName,'-o','none')
  if ($LASTEXITCODE -eq 0) {
    return $true
  }

  Write-Warning "Could not set custom domain for '$AccountName'."
  if ($output) { $output | ForEach-Object { Write-Warning $_ } }
  Write-Host 'Skip Foundry project creation for this resource; model deployment will continue against the existing account.'
  return $false
}

function Ensure-FoundryProject {
  Write-Host ''
  Write-Host "Ensuring Azure AI Foundry project '$ProjectName'..."
  & az cognitiveservices account project show --name $AccountName --resource-group $ResourceGroup --project-name $ProjectName -o none 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Azure AI Foundry project '$ProjectName' already exists. Skip create."
    return
  }
  $output = Invoke-AzureCli -Arguments @('cognitiveservices','account','project','create','--name',$AccountName,'--resource-group',$ResourceGroup,'--project-name',$ProjectName,'--location',$AccountLocation,'-o','none')
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Could not create Foundry project '$ProjectName'."
    if ($output) { $output | ForEach-Object { Write-Warning $_ } }
    Write-Host 'Skip project creation and continue.'
  }
}

function Deployment-Exists {
  param([string]$DeploymentName)
  & az cognitiveservices account deployment show --name $AccountName --resource-group $ResourceGroup --deployment-name $DeploymentName -o none 2>$null
  return $LASTEXITCODE -eq 0
}

function Get-DeploymentState {
  param([string]$DeploymentName)
  $url = 'https://management.azure.com/subscriptions/' + $SubscriptionId + '/resourceGroups/' + $ResourceGroup + '/providers/Microsoft.CognitiveServices/accounts/' + $AccountName + '/deployments/' + $DeploymentName + '?api-version=' + $DeploymentApiVersion
  $state = Invoke-AzureCliQuiet -Arguments @('rest','--method','get','--url',$url,'--query','properties.provisioningState','-o','tsv')
  if ($LASTEXITCODE -ne 0) { return '' }
  return $state
}

function Get-ExistingCapacityIfSameModel {
  param([string]$DeploymentName, [string]$ModelFormat, [string]$ModelName, [string]$ModelVersion, [string]$SkuName)
  $url = 'https://management.azure.com/subscriptions/' + $SubscriptionId + '/resourceGroups/' + $ResourceGroup + '/providers/Microsoft.CognitiveServices/accounts/' + $AccountName + '/deployments/' + $DeploymentName + '?api-version=' + $DeploymentApiVersion
  $deployment = Invoke-AzCliJson -Arguments @('rest','--method','get','--url',$url,'-o','json') -QuietOnError
  if (-not $deployment) { return 0 }
  if ($deployment.properties.model.format -eq $ModelFormat -and $deployment.properties.model.name -eq $ModelName -and $deployment.properties.model.version -eq $ModelVersion -and $deployment.sku.name -eq $SkuName) {
    if ($deployment.sku.capacity) { return [int]$deployment.sku.capacity }
    if ($deployment.properties.currentCapacity) { return [int]$deployment.properties.currentCapacity }
  }
  return 0
}

function Get-ExistingDeploymentIfSameModel {
  param([string]$DeploymentName, [string]$ModelFormat, [string]$ModelName, [string]$ModelVersion)
  $url = 'https://management.azure.com/subscriptions/' + $SubscriptionId + '/resourceGroups/' + $ResourceGroup + '/providers/Microsoft.CognitiveServices/accounts/' + $AccountName + '/deployments/' + $DeploymentName + '?api-version=' + $DeploymentApiVersion
  $deployment = Invoke-AzCliJson -Arguments @('rest','--method','get','--url',$url,'-o','json') -QuietOnError
  if (-not $deployment) { return $null }
  if ($deployment.properties.model.format -ne $ModelFormat -or $deployment.properties.model.name -ne $ModelName -or $deployment.properties.model.version -ne $ModelVersion) {
    return $null
  }
  $capacity = 0
  if ($deployment.sku.capacity) { $capacity = [int]$deployment.sku.capacity }
  elseif ($deployment.properties.currentCapacity) { $capacity = [int]$deployment.properties.currentCapacity }
  return [pscustomobject]@{
    SkuName = $deployment.sku.name
    Capacity = $capacity
  }
}

function Get-AvailableCapacity {
  param([string]$ModelFormat, [string]$ModelName, [string]$ModelVersion, [string]$SkuName)
  $url = 'https://management.azure.com/subscriptions/' + $SubscriptionId + '/providers/Microsoft.CognitiveServices/locations/' + $AccountLocation + '/modelCapacities?api-version=' + $CapacityApiVersion + '&modelFormat=' + $ModelFormat + '&modelName=' + $ModelName + '&modelVersion=' + $ModelVersion
  $json = Invoke-AzCliJson -Arguments @('rest','--method','get','--url',$url,'-o','json')
  if (-not $json -or -not $json.value) { return $null }
  $values = @()
  foreach ($item in $json.value) {
    $location = if ($item.location) { $item.location } elseif ($item.properties.location) { $item.properties.location } else { $AccountLocation }
    $sku = if ($item.properties.skuName) { $item.properties.skuName } elseif ($item.sku.name) { $item.sku.name } elseif ($item.skuName) { $item.skuName } else { $item.name }
    if ($location -and $sku -and $location.ToLowerInvariant() -eq $AccountLocation.ToLowerInvariant() -and $sku.ToLowerInvariant() -eq $SkuName.ToLowerInvariant()) {
      $capacity = if ($item.properties.availableCapacity -ne $null) { $item.properties.availableCapacity } else { $item.availableCapacity }
      if ($capacity -ne $null) { $values += [int][math]::Floor([double]$capacity) }
    }
  }
  if ($values.Count -eq 0) { return $null }
  return ($values | Measure-Object -Maximum).Maximum
}

function Select-GlobalStandardCapacity {
  param([string]$ModelFormat, [string]$ModelName, [string]$ModelVersion)
  $capacity = Get-AvailableCapacity -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion -SkuName $SkuName
  if ($null -eq $capacity) {
    return $null
  }

  Write-Host ('GlobalStandard availableCapacity={0}' -f $capacity)
  return [pscustomobject]@{
    SkuName = $SkuName
    Capacity = [int]$capacity
  }
}

function Print-CapacityDebug {
  param([string]$ModelFormat, [string]$ModelName, [string]$ModelVersion)
  Write-Host 'Capacity rows returned by modelCapacities API:'
  $url = 'https://management.azure.com/subscriptions/' + $SubscriptionId + '/providers/Microsoft.CognitiveServices/locations/' + $AccountLocation + '/modelCapacities?api-version=' + $CapacityApiVersion + '&modelFormat=' + $ModelFormat + '&modelName=' + $ModelName + '&modelVersion=' + $ModelVersion
  Invoke-AzureCliQuiet -Arguments @('rest','--method','get','--url',$url,'--query','value[].{location:location,propertiesLocation:properties.location,sku:properties.skuName,skuName:sku.name,topSkuName:skuName,name:name,availableCapacity:properties.availableCapacity,topAvailableCapacity:availableCapacity,modelName:properties.model.name,modelVersion:properties.model.version}','-o','table')
}

function Wait-UntilSucceeded {
  param([string]$DeploymentName, [int]$MaxAttempts = 120, [int]$SleepSeconds = 10)
  Write-Host "Waiting for '$DeploymentName' to reach Succeeded..."
  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    $state = Get-DeploymentState -DeploymentName $DeploymentName
    $displayState = if ($state) { $state } else { 'Unknown' }
    Write-Host ('  [{0}/{1}] {2}: {3}' -f $attempt, $MaxAttempts, $DeploymentName, $displayState)
    if ($state -eq 'Succeeded') { return $true }
    if ($state -in @('Failed','Canceled','Cancelled')) { return $false }
    Start-Sleep -Seconds $SleepSeconds
  }
  return $false
}

function Deploy-ModelWithMaxCapacity {
  param([string]$DeploymentName, [string]$ModelFormat, [string]$ModelName, [string]$ModelVersion, [int]$ConfiguredMaxCapacity = 0)
  Write-Host ''
  Write-Host '============================================================'
  Write-Host "Deployment name: $DeploymentName"
  Write-Host "Model format:    $ModelFormat"
  Write-Host "Model name:      $ModelName"
  Write-Host "Model version:   $ModelVersion"
  Write-Host "SKU:             $SkuName"
  Write-Host "Region:          $AccountLocation"
  Write-Host '============================================================'

  $deploymentAlreadyExists = Deployment-Exists -DeploymentName $DeploymentName
  if ($deploymentAlreadyExists) {
    Write-Host "Deployment '$DeploymentName' already exists."
    if ($OverwriteExisting -ne 'true') {
      Write-Host "Skip '$DeploymentName' because OVERWRITE_EXISTING is not true."
      return 2
    }
    Write-Host 'OVERWRITE_EXISTING=true, this deployment may be updated.'
  }

  $selectedSkuCapacity = $null
  $forceConfiguredCapacity = $false
  if ($deploymentAlreadyExists) {
    $existingDeployment = Get-ExistingDeploymentIfSameModel -DeploymentName $DeploymentName -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
    if ($null -ne $existingDeployment -and $existingDeployment.SkuName) {
      if ($existingDeployment.SkuName -eq $SkuName) {
        Write-Host "Existing same-model deployment uses SKU '$($existingDeployment.SkuName)', preserving this SKU."
        $availableForExistingSku = Get-AvailableCapacity -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion -SkuName $SkuName
        if ($null -eq $availableForExistingSku) { $availableForExistingSku = 0 }
        $selectedSkuCapacity = [pscustomobject]@{
          SkuName = $SkuName
          Capacity = [int]$availableForExistingSku
          ExistingCapacity = [int]$existingDeployment.Capacity
        }
      } else {
        Write-Host "Existing same-model deployment uses SKU '$($existingDeployment.SkuName)', but this script only deploys $SkuName."
        Write-Host "Will force redeploy to $SkuName using configured max capacity."
        $selectedSkuCapacity = [pscustomobject]@{
          SkuName = $SkuName
          Capacity = 0
          ExistingCapacity = 0
        }
        $forceConfiguredCapacity = $true
      }
    }
  }

  if ($null -eq $selectedSkuCapacity) {
    $selectedSkuCapacity = Select-GlobalStandardCapacity -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
    if ($null -eq $selectedSkuCapacity) {
      Write-Warning "No $SkuName availableCapacity found in $AccountLocation."
      Print-CapacityDebug -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
      return 2
    }
  }

  $selectedSkuName = $selectedSkuCapacity.SkuName
  $availableCapacity = [int]$selectedSkuCapacity.Capacity
  if ($selectedSkuCapacity.PSObject.Properties.Name -contains 'ExistingCapacity') {
    $existingCapacity = [int]$selectedSkuCapacity.ExistingCapacity
  } else {
    $existingCapacity = Get-ExistingCapacityIfSameModel -DeploymentName $DeploymentName -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion -SkuName $selectedSkuName
  }
  $targetCapacity = $availableCapacity + [int]$existingCapacity
  # Azure reports availableCapacity after existing deployments consume quota.
  # When overwriting the same model deployment, add its current capacity back
  # so a fully allocated quota does not collapse the deployment to 0.
  if ($forceConfiguredCapacity -and $ConfiguredMaxCapacity -gt $targetCapacity) {
    Write-Host "Force GlobalStandard target capacity from configured max capacity: $ConfiguredMaxCapacity"
    $targetCapacity = $ConfiguredMaxCapacity
  }
  if ($targetCapacity -le 0) {
    Write-Warning "Max deployable capacity is $targetCapacity; skip '$DeploymentName'."
    Print-CapacityDebug -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
    return 2
  }

  Write-Host "Available capacity:           $availableCapacity"
  Write-Host "Selected SKU:                 $selectedSkuName"
  Write-Host "Used quota from existing deployment: $existingCapacity"
  Write-Host "Target deployment capacity:   $targetCapacity"
  $deploymentUrl = $BaseUrl + '/' + $DeploymentName + '?api-version=' + $DeploymentApiVersion
  $deploymentPayloadPath = Join-Path ([System.IO.Path]::GetTempPath()) ('foundry-deployment-' + [System.Guid]::NewGuid().ToString('N') + '.json')
  @{
    properties = @{
      model = @{
        format = $ModelFormat
        name = $ModelName
        version = $ModelVersion
      }
      versionUpgradeOption = $VersionUpgradeOption
      raiPolicyName = $RaiPolicyName
    }
    sku = @{
      name = $selectedSkuName
      capacity = $targetCapacity
    }
  } | ConvertTo-Json -Depth 10 -Compress | Set-Content -LiteralPath $deploymentPayloadPath -Encoding UTF8
  try {
    Invoke-AzureCli -Arguments @('rest','--method','put','--url',$deploymentUrl,'--headers','Content-Type=application/json','--body',('@' + $deploymentPayloadPath),'-o','jsonc') | Out-Host
    if ($LASTEXITCODE -ne 0) { return 1 }
  } finally {
    Remove-Item -LiteralPath $deploymentPayloadPath -Force -ErrorAction SilentlyContinue
  }
  if (-not (Wait-UntilSucceeded -DeploymentName $DeploymentName)) { return 1 }
  return 0
}

function Print-CopyableModelImportList {
  Write-Host ''
  Write-Host '============================================================'
  Write-Host 'Copyable model import list'
  Write-Host '============================================================'
  $baseUrl = "https://management.azure.com/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.CognitiveServices/accounts/$AccountName/deployments"
  $json = Invoke-AzCliJson -Arguments @('rest','--method','get','--url',($baseUrl + '?api-version=' + $DeploymentApiVersion),'-o','json')
  if (-not $json -or -not $json.value) {
    Write-Host 'No succeeded deployments found.'
    return
  }
  $names = New-Object System.Collections.Generic.List[string]
  foreach ($item in $json.value) {
    if ($item.properties.provisioningState -ne 'Succeeded') { continue }
    foreach ($name in @($item.properties.model.name, $item.name)) {
      if ($name -and -not $names.Contains($name)) { $names.Add($name) }
    }
  }
  if ($names.Count -eq 0) { Write-Host 'No succeeded deployments found.' } else { Write-Host ($names -join ', ') }
}

function Print-AccountKeySummary {
  $key1 = (& az cognitiveservices account keys list --name $AccountName --resource-group $ResourceGroup --query key1 -o tsv 2>$null)
  Write-Host ''
  Write-Host '============================================================'
  Write-Host 'Account access summary'
  Write-Host '============================================================'
  Write-Host "Subscription ID:  $SubscriptionId"
  Write-Host "Region:           $AccountLocation"
  Write-Host "Resource name:    $AccountName"
  Write-Host "Foundry endpoint: https://$AccountName.services.ai.azure.com/api/projects/$ProjectName"
  Write-Host "OpenAI endpoint:  https://$AccountName.openai.azure.com"
  Write-Host "Key1:             $key1"
}

function Append-DeploymentReport {
  $key1 = (& az cognitiveservices account keys list --name $AccountName --resource-group $ResourceGroup --query key1 -o tsv 2>$null)
  $finalDeploymentsUrl = $BaseUrl + '?api-version=' + $DeploymentApiVersion
  $json = Invoke-AzCliJson -Arguments @('rest','--method','get','--url',$finalDeploymentsUrl,'-o','json') -QuietOnError
  $deployments = @()
  if ($json -and $json.value) {
    foreach ($item in @($json.value)) {
      $deployments += [pscustomobject]@{
        deploymentName = $item.name
        modelName = $item.properties.model.name
        modelVersion = $item.properties.model.version
        sku = $item.sku.name
        capacity = $item.sku.capacity
        state = $item.properties.provisioningState
        raiPolicy = $item.properties.raiPolicyName
      }
    }
  }

  $payload = [pscustomobject]@{
    schema = 'ai-foundry-manager.deployment-result.v1'
    subscriptionId = $SubscriptionId
    regions = @(
      [pscustomobject]@{
        region = $AccountLocation
        resourceName = $AccountName
        foundryProjectEndpoint = "https://$AccountName.services.ai.azure.com/api/projects/$ProjectName"
        openaiEndpoint = "https://$AccountName.openai.azure.com"
        aiServicesEndpoint = "https://$AccountName.services.ai.azure.com"
        apiKey = $key1
        deployments = $deployments
      }
    )
  } | ConvertTo-Json -Depth 10 -Compress

  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('')
  $lines.Add('============================================================')
  $lines.Add('Account access summary')
  $lines.Add('============================================================')
  $lines.Add("Subscription ID:  $SubscriptionId")
  $lines.Add("Region:           $AccountLocation")
  $lines.Add("Resource name:    $AccountName")
  $lines.Add("Foundry endpoint: https://$AccountName.services.ai.azure.com/api/projects/$ProjectName")
  $lines.Add("OpenAI endpoint:  https://$AccountName.openai.azure.com")
  $lines.Add("Key1:             $key1")
  $lines.Add('')
  $lines.Add("Final deployments under account '$AccountName'")
  if ($deployments.Count -eq 0) {
    $lines.Add('No deployments found.')
  } else {
    foreach ($deployment in $deployments) {
      $lines.Add("  - $($deployment.deploymentName) | $($deployment.modelName) | $($deployment.modelVersion) | $($deployment.sku) | capacity=$($deployment.capacity) | state=$($deployment.state) | raiPolicy=$($deployment.raiPolicy)")
    }
  }
  $lines.Add('')
  $lines.Add('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN')
  $lines.Add($payload)
  $lines.Add('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END')
  $lines | Add-Content -LiteralPath $script:ReportPath -Encoding UTF8
}

function Prepare-AccountResources {
  Ensure-ResourceGroup
  $accountReadyForProject = Ensure-FoundryAccount
  if ($accountReadyForProject) {
    Ensure-FoundryProject
  } else {
    Write-Host 'Skip Foundry project creation because custom domain is not ready.'
  }
  Print-AccountKeySummary
}

function Deploy-AllModels {
  foreach ($item in $Models) {
    $parts = $item -split '\\|', 5
    if ($parts.Count -lt 4) { continue }
    $configuredMaxCapacity = 0
    if ($parts.Count -ge 5) {
      [void][int]::TryParse($parts[4], [ref]$configuredMaxCapacity)
    }
    $rc = Deploy-ModelWithMaxCapacity -DeploymentName $parts[0] -ModelFormat $parts[1] -ModelName $parts[2] -ModelVersion $parts[3] -ConfiguredMaxCapacity $configuredMaxCapacity
    if ($rc -eq 0) {
      Write-Host "SUCCESS: $($parts[0])"
      $SucceededDeployments += $parts[0]
    } elseif ($rc -eq 2) {
      Write-Host "SKIPPED: $($parts[0])"
      $SkippedDeployments += $parts[0]
    } else {
      Write-Host "FAILED: $($parts[0])"
      $FailedDeployments += $parts[0]
    }
    Write-Host 'Continue to next deployment...'
  }
}

function Print-DeploymentSummary {
  Write-Host ''
  Write-Host '============================================================'
  Write-Host 'Deployment summary'
  Write-Host '============================================================'
  Write-Host "Succeeded: $($SucceededDeployments.Count)"
  $SucceededDeployments | ForEach-Object { Write-Host "  OK      $_" }
  Write-Host ''
  Write-Host "Skipped: $($SkippedDeployments.Count)"
  $SkippedDeployments | ForEach-Object { Write-Host "  SKIP    $_" }
  Write-Host ''
  Write-Host "Failed: $($FailedDeployments.Count)"
  $FailedDeployments | ForEach-Object { Write-Host "  FAIL    $_" }
}

function Print-FinalDeployments {
  $finalDeploymentsUrl = $BaseUrl + '?api-version=' + $DeploymentApiVersion
  Write-Host ''
  Write-Host "Final deployments under account '$AccountName'"
  Invoke-AzureCliQuiet -Arguments @('rest','--method','get','--url',$finalDeploymentsUrl,'--query','value[].{deploymentName:name,modelName:properties.model.name,modelVersion:properties.model.version,sku:sku.name,capacity:sku.capacity,state:properties.provisioningState,raiPolicy:properties.raiPolicyName}','-o','table')
}

Login-AndSelectSubscription

function Initialize-DeploymentReport {
  if ($env:AZURE_FOUNDRY_REPORT_PATH) {
    $script:ReportPath = $env:AZURE_FOUNDRY_REPORT_PATH
    return
  }

  $reportAccount = if ($AccountEmail) { $AccountEmail } else { $AccountName }
  $reportAccount = ($reportAccount -replace '[^A-Za-z0-9._@-]', '-').Trim('-')
  if (-not $reportAccount) { $reportAccount = $AccountName }
  $script:ReportPath = Join-Path $ScriptDir ("foundry-deployment-result-$reportAccount-$SubscriptionId-$ReportTimestamp.txt")
  $env:AZURE_FOUNDRY_REPORT_PATH = $script:ReportPath
  $env:AZURE_FOUNDRY_REPORT_TIMESTAMP = $ReportTimestamp
  @(
    'Azure AI Foundry deployment result'
    ('Generated at: ' + (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))
    "Subscription ID: $SubscriptionId"
    ''
  ) | Set-Content -LiteralPath $script:ReportPath -Encoding UTF8
  Write-Host "Deployment result report: $script:ReportPath"
}

Initialize-DeploymentReport

Write-Host 'Current Azure account:'
& az account show --query "{subscriptionName:name, subscriptionId:id, state:state, user:user.name}" -o table
Ensure-ProviderRegistered

$BaseUrl = "https://management.azure.com/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.CognitiveServices/accounts/$AccountName/deployments"
$Models = @(
${modelRows}
)

if ($DeploymentRunMode -ne 'deploy-only') {
  Prepare-AccountResources
}

if ($DeploymentRunMode -ne 'prepare-only') {
  Deploy-AllModels
  Print-DeploymentSummary
  Print-FinalDeployments
}

Print-CopyableModelImportList
Print-AccountKeySummary
Append-DeploymentReport
Write-Host "Deployment result report: $script:ReportPath"
`;
}

export function buildAzureCliPowerShellDeploymentScript(
  input: AzureCliDeploymentInput
): string {
  const validation = validateAzureCliDeploymentInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const identity = deriveIdentity(input);
  if (!identity) {
    throw new Error('Unable to derive Azure CLI deployment identity');
  }

  return buildAzureCliPowerShellDeploymentScriptBody(
    identity,
    stringifyPowerShellModelRows(input.models),
    input.servicePrincipal,
    input.accountEmail,
    input.overwriteExisting
  );
}

export function buildAzureCliPowerShellMultiRegionDeploymentScript(
  input: AzureCliMultiRegionDeploymentInput
): string {
  const subscriptionId = input.subscriptionId?.trim() || '';
  const resourceGroupName = input.resourceGroupName.trim();
  const targets = input.targets.filter((target) => target.models.length > 0);

  if (!resourceGroupName) {
    throw new Error('resourceGroupName is required');
  }
  if (targets.length === 0) {
    throw new Error('targets are required');
  }

  return [
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_PATH -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_TIMESTAMP -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID -ErrorAction SilentlyContinue',
    "$env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID = 'true'",
    '# ============================================================',
    '# Prepare all selected regions first',
    '# ============================================================',
    ...targets.map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliPowerShellDeploymentScript({
        subscriptionId,
        servicePrincipal: input.servicePrincipal,
        accountEmail: input.accountEmail,
        resourceGroupName,
        resourceName: target.resourceName,
        location: target.location,
        foundryProjectEndpoint: target.foundryProjectEndpoint,
        models: target.models,
        overwriteExisting: input.overwriteExisting,
      });

      return [
        `# ============================================================`,
        `# Prepare ${label.replace(/\r?\n/g, ' ')}`,
        `# ============================================================`,
        `$env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE = 'prepare-only'`,
        script,
      ].join('\n');
    }),
    '# ============================================================',
    '# Deploy models after all selected regions are prepared',
    '# ============================================================',
    ...targets.map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliPowerShellDeploymentScript({
        subscriptionId,
        servicePrincipal: input.servicePrincipal,
        accountEmail: input.accountEmail,
        resourceGroupName,
        resourceName: target.resourceName,
        location: target.location,
        foundryProjectEndpoint: target.foundryProjectEndpoint,
        models: target.models,
        overwriteExisting: input.overwriteExisting,
      });

      return [
        `# ============================================================`,
        `# Deploy ${label.replace(/\r?\n/g, ' ')}`,
        `# ============================================================`,
        `$env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE = 'deploy-only'`,
        script,
      ].join('\n');
    }),
    'Remove-Item Env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_PATH -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_TIMESTAMP -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_CONFIG_DIR -ErrorAction SilentlyContinue',
  ].join('\n\n');
}
