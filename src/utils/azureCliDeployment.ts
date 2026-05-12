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
  resourceName: string;
  location: string;
  resourceGroupName?: string;
  foundryProjectEndpoint?: string;
  models: AzureCliDeploymentModel[];
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
  resourceGroupName: string;
  targets: AzureCliDeploymentTargetInput[];
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

  if (!input.subscriptionId?.trim() && !hasCompleteServicePrincipal(input.servicePrincipal)) {
    errors.push('subscriptionId or complete servicePrincipal is required');
  }
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
        )}"`
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
  servicePrincipal?: AzureCliServicePrincipal
): string {
  const configuredSubscriptionId = identity.subscriptionId;
  const sp = servicePrincipal;
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
RESOURCE_GROUP="${shellDoubleQuote(identity.resourceGroup)}"
RESOURCE_GROUP_LOCATION="${shellDoubleQuote(identity.location)}"
ACCOUNT_NAME="${shellDoubleQuote(identity.accountName)}"
ACCOUNT_LOCATION="${shellDoubleQuote(identity.location)}"
PROJECT_NAME="${shellDoubleQuote(identity.projectId)}"
DEPLOYMENT_API_VERSION="2025-09-01"
CAPACITY_API_VERSION="2025-06-01"

SKU_CANDIDATES=(
  "\${AZURE_FOUNDRY_PREFERRED_SKU:-GlobalStandard}"
  "DataZoneStandard"
  "Standard"
)

# false = skip existing deployments
# true  = update existing deployments
OVERWRITE_EXISTING="\${OVERWRITE_EXISTING:-true}"

# Optional: try to register provider before deployment
AUTO_REGISTER_PROVIDER="\${AUTO_REGISTER_PROVIDER:-true}"

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

  if [ -n "\${AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID:-}" ]; then
    SUBSCRIPTION_ID="\${AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID}"
    echo "Reusing selected subscription: \${SUBSCRIPTION_ID}"
  elif [ -n "\${CONFIGURED_SUBSCRIPTION_ID}" ]; then
    SUBSCRIPTION_ID="\${CONFIGURED_SUBSCRIPTION_ID}"
    echo "Using configured subscription: \${SUBSCRIPTION_ID}"
  else
    local subscriptions_json
    local subscription_count

    echo "Discovering enabled subscriptions..."
    subscriptions_json="$(az account list --query "[?state=='Enabled'].{id:id,name:name,tenantId:tenantId}" -o json)"
    subscription_count="$(echo "\${subscriptions_json}" | jq 'length')"

    if [ "\${subscription_count}" -eq 0 ]; then
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

  export AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID="\${SUBSCRIPTION_ID}"
}

login_and_select_subscription

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

  echo "Ensuring custom domain '\${ACCOUNT_NAME}'..."
  az cognitiveservices account update \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --custom-domain "\${ACCOUNT_NAME}" \\
    -o none
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

  az cognitiveservices account project create \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --project-name "\${PROJECT_NAME}" \\
    --location "\${ACCOUNT_LOCATION}" \\
    -o none
}

ensure_resource_group
ensure_foundry_account
ensure_foundry_project

echo
echo "Account location: \${ACCOUNT_LOCATION}"
echo "Project name:     \${PROJECT_NAME}"

BASE_URL="https://management.azure.com/subscriptions/\${SUBSCRIPTION_ID}/resourceGroups/\${RESOURCE_GROUP}/providers/Microsoft.CognitiveServices/accounts/\${ACCOUNT_NAME}/deployments"
CAPACITY_URL="https://management.azure.com/subscriptions/\${SUBSCRIPTION_ID}/providers/Microsoft.CognitiveServices/locations/\${ACCOUNT_LOCATION}/modelCapacities"

# ============================================================
# Model list
# Format:
# deploymentName|modelFormat|modelName|version
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

select_best_sku_capacity() {
  local model_format="$1"
  local model_name="$2"
  local model_version="$3"
  local best_sku=""
  local best_capacity=""

  for sku_name in "\${SKU_CANDIDATES[@]}"; do
    local capacity
    capacity="$(get_available_capacity "\${model_format}" "\${model_name}" "\${model_version}" "\${sku_name}")"
    local rc=$?

    if [ "\${rc}" -ne 0 ]; then
      return "\${rc}"
    fi
    if [ -z "\${capacity}" ]; then
      echo "No availableCapacity for SKU \${sku_name}." >&2
      continue
    fi
    if ! [[ "\${capacity}" =~ ^[0-9]+$ ]]; then
      echo "ERROR: Invalid available capacity value for SKU \${sku_name}: \${capacity}"
      return 1
    fi

    echo "Candidate SKU \${sku_name}: availableCapacity=\${capacity}" >&2
    if [ -z "\${best_capacity}" ] || [ "\${capacity}" -gt "\${best_capacity}" ]; then
      best_sku="\${sku_name}"
      best_capacity="\${capacity}"
    fi
  done

  if [ -z "\${best_sku}" ]; then
    return 2
  fi

  echo "\${best_sku}|\${best_capacity}"
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

  echo
  echo "============================================================"
  echo "Deployment name: \${deployment_name}"
  echo "Model format:    \${model_format}"
  echo "Model name:      \${model_name}"
  echo "Model version:   \${model_version}"
  echo "SKU candidates:  \${SKU_CANDIDATES[*]}"
  echo "Region:          \${ACCOUNT_LOCATION}"
  echo "============================================================"

  if deployment_exists "\${deployment_name}"; then
    echo "Deployment '\${deployment_name}' already exists."

    if [ "\${OVERWRITE_EXISTING}" != "true" ]; then
      echo "Skip '\${deployment_name}' because OVERWRITE_EXISTING=false."
      return 2
    fi

    echo "OVERWRITE_EXISTING=true, this deployment may be updated."
  fi

  local selected_sku_capacity
  selected_sku_capacity="$(select_best_sku_capacity "\${model_format}" "\${model_name}" "\${model_version}")"
  local capacity_rc=$?

  if [ "\${capacity_rc}" -ne 0 ]; then
    if [ "\${capacity_rc}" -eq 2 ]; then
      echo "WARNING: No availableCapacity found for candidate SKUs in \${ACCOUNT_LOCATION}."
      print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
      echo "Skip '\${deployment_name}'."
      return 2
    fi
    echo "ERROR: Failed to query available capacity for \${model_name} \${model_version}."
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 1
  fi

  local selected_sku
  local available_capacity
  IFS='|' read -r selected_sku available_capacity <<< "\${selected_sku_capacity}"

  if ! [[ "\${available_capacity}" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid available capacity value: \${available_capacity}"
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 1
  fi

  local existing_same_model_capacity
  existing_same_model_capacity="$(get_existing_capacity_if_same_model "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}" "\${selected_sku}")"

  if ! [[ "\${existing_same_model_capacity}" =~ ^[0-9]+$ ]]; then
    echo "WARNING: Invalid existing capacity value '\${existing_same_model_capacity}', assume 0."
    existing_same_model_capacity="0"
  fi

  local target_capacity
  target_capacity=$((available_capacity + existing_same_model_capacity))

  if [ "\${target_capacity}" -le 0 ]; then
    echo "WARNING: Max deployable capacity is \${target_capacity}; skip '\${deployment_name}'."
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 2
  fi

  echo "Available capacity:            \${available_capacity}"
  echo "Selected SKU:                  \${selected_sku}"
  echo "Existing same-model capacity:  \${existing_same_model_capacity}"
  echo "Target deployment capacity:    \${target_capacity}"
  echo "Creating or updating deployment '\${deployment_name}'..."

  if ! az cognitiveservices account deployment create \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --deployment-name "\${deployment_name}" \\
    --model-format "\${model_format}" \\
    --model-name "\${model_name}" \\
    --model-version "\${model_version}" \\
    --sku-name "\${selected_sku}" \\
    --sku-capacity "\${target_capacity}" \\
    -o jsonc; then

    echo "ERROR: Azure CLI deployment create failed for '\${deployment_name}'."
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

# ============================================================
# Main deployment loop
# ============================================================
for item in "\${MODELS[@]}"; do
  IFS='|' read -r deployment_name model_format model_name model_version <<< "\${item}"

  deploy_model_with_max_capacity "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}"
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

print_copyable_model_import_list
print_account_key_summary
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
    input.servicePrincipal
  );
}

export function buildAzureCliMultiRegionDeploymentScript(
  input: AzureCliMultiRegionDeploymentInput
): string {
  const subscriptionId = input.subscriptionId?.trim() || '';
  const resourceGroupName = input.resourceGroupName.trim();
  const targets = input.targets.filter((target) => target.models.length > 0);

  if (!subscriptionId && !hasCompleteServicePrincipal(input.servicePrincipal)) {
    throw new Error('subscriptionId or complete servicePrincipal is required');
  }
  if (!resourceGroupName) {
    throw new Error('resourceGroupName is required');
  }
  if (targets.length === 0) {
    throw new Error('targets are required');
  }

  return targets
    .map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliDeploymentScript({
        subscriptionId,
        servicePrincipal: input.servicePrincipal,
        resourceGroupName,
        resourceName: target.resourceName,
        location: target.location,
        foundryProjectEndpoint: target.foundryProjectEndpoint,
        models: target.models,
      });

      return [
        `# ============================================================`,
        `# ${shellDoubleQuote(label)}`,
        `# ============================================================`,
        script,
      ].join('\n');
    })
    .join('\n\n');
}

function stringifyPowerShellModelRows(models: AzureCliDeploymentModel[]): string {
  return models
    .map(
      (model) =>
        `  '${powershellSingleQuote(model.deploymentName.trim())}|${powershellSingleQuote(
          model.modelFormat.trim()
        )}|${powershellSingleQuote(model.modelName.trim())}|${powershellSingleQuote(
          model.version.trim()
        )}'`
    )
    .join(',\n');
}

function buildAzureCliPowerShellDeploymentScriptBody(
  identity: AzureCliDeploymentIdentity,
  modelRows: string,
  servicePrincipal?: AzureCliServicePrincipal
): string {
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
$ResourceGroup = '${powershellSingleQuote(identity.resourceGroup)}'
$ResourceGroupLocation = '${powershellSingleQuote(identity.location)}'
$AccountName = '${powershellSingleQuote(identity.accountName)}'
$AccountLocation = '${powershellSingleQuote(identity.location)}'
$ProjectName = '${powershellSingleQuote(identity.projectId)}'
$DeploymentApiVersion = '2025-09-01'
$CapacityApiVersion = '2025-06-01'
$SkuCandidates = @(
  $(if ($env:AZURE_FOUNDRY_PREFERRED_SKU) { $env:AZURE_FOUNDRY_PREFERRED_SKU } else { 'GlobalStandard' }),
  'DataZoneStandard',
  'Standard'
)
$OverwriteExisting = if ($env:OVERWRITE_EXISTING) { $env:OVERWRITE_EXISTING } else { 'true' }
$AutoRegisterProvider = if ($env:AUTO_REGISTER_PROVIDER) { $env:AUTO_REGISTER_PROVIDER } else { 'true' }

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
  param([Parameter(Mandatory=$true)][string[]]$Arguments)
  $output = Invoke-AzureCli -Arguments $Arguments
  if ($LASTEXITCODE -ne 0) {
    Write-Warning ('Azure CLI command failed: az ' + ($Arguments -join ' '))
    if ($output) {
      $output | ForEach-Object { Write-Warning $_ }
    }
    return $null
  }
  if (-not $output) {
    return $null
  }
  return ($output | ConvertFrom-Json)
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

  if ($env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID) {
    $script:SubscriptionId = $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID
    Write-Host "Reusing selected subscription: $script:SubscriptionId"
  } elseif ($ConfiguredSubscriptionId) {
    $script:SubscriptionId = $ConfiguredSubscriptionId
    Write-Host "Using configured subscription: $script:SubscriptionId"
  } else {
    Write-Host 'Discovering enabled subscriptions...'
    $subscriptions = Invoke-AzCliJson -Arguments @('account','list','--query',"[?state=='Enabled'].{id:id,name:name,tenantId:tenantId}",'-o','json')
    if (-not $subscriptions) {
      throw 'No enabled subscriptions are visible to this identity.'
    }
    if ($subscriptions -isnot [array]) {
      $subscriptions = @($subscriptions)
    }

    if ($subscriptions.Count -eq 0) {
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
  $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID = $script:SubscriptionId
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
  & az cognitiveservices account show --name $AccountName --resource-group $ResourceGroup -o none 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Azure AI Foundry resource '$AccountName' already exists. Skip create."
  } else {
    & az cognitiveservices account create --name $AccountName --resource-group $ResourceGroup --kind AIServices --sku s0 --location $AccountLocation --allow-project-management -o none
  }

  Write-Host "Ensuring custom domain '$AccountName'..."
  & az cognitiveservices account update --name $AccountName --resource-group $ResourceGroup --custom-domain $AccountName -o none
}

function Ensure-FoundryProject {
  Write-Host ''
  Write-Host "Ensuring Azure AI Foundry project '$ProjectName'..."
  & az cognitiveservices account project show --name $AccountName --resource-group $ResourceGroup --project-name $ProjectName -o none 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Azure AI Foundry project '$ProjectName' already exists. Skip create."
    return
  }
  & az cognitiveservices account project create --name $AccountName --resource-group $ResourceGroup --project-name $ProjectName --location $AccountLocation -o none
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
  $deployment = Invoke-AzCliJson -Arguments @('rest','--method','get','--url',$url,'-o','json')
  if (-not $deployment) { return 0 }
  if ($deployment.properties.model.format -eq $ModelFormat -and $deployment.properties.model.name -eq $ModelName -and $deployment.properties.model.version -eq $ModelVersion -and $deployment.sku.name -eq $SkuName) {
    if ($deployment.sku.capacity) { return [int]$deployment.sku.capacity }
    if ($deployment.properties.currentCapacity) { return [int]$deployment.properties.currentCapacity }
  }
  return 0
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

function Select-BestSkuCapacity {
  param([string]$ModelFormat, [string]$ModelName, [string]$ModelVersion)
  $best = $null

  foreach ($skuName in $SkuCandidates) {
    $capacity = Get-AvailableCapacity -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion -SkuName $skuName
    if ($null -eq $capacity) {
      Write-Host "No availableCapacity for SKU $skuName."
      continue
    }
    Write-Host ('Candidate SKU {0}: availableCapacity={1}' -f $skuName, $capacity)
    if ($null -eq $best -or [int]$capacity -gt [int]$best.Capacity) {
      $best = [pscustomobject]@{
        SkuName = $skuName
        Capacity = [int]$capacity
      }
    }
  }

  return $best
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
  param([string]$DeploymentName, [string]$ModelFormat, [string]$ModelName, [string]$ModelVersion)
  Write-Host ''
  Write-Host '============================================================'
  Write-Host "Deployment name: $DeploymentName"
  Write-Host "Model format:    $ModelFormat"
  Write-Host "Model name:      $ModelName"
  Write-Host "Model version:   $ModelVersion"
  Write-Host "SKU candidates:  $($SkuCandidates -join ', ')"
  Write-Host "Region:          $AccountLocation"
  Write-Host '============================================================'

  if (Deployment-Exists -DeploymentName $DeploymentName) {
    Write-Host "Deployment '$DeploymentName' already exists."
    if ($OverwriteExisting -ne 'true') {
      Write-Host "Skip '$DeploymentName' because OVERWRITE_EXISTING is not true."
      return 2
    }
    Write-Host 'OVERWRITE_EXISTING=true, this deployment may be updated.'
  }

  $selectedSkuCapacity = Select-BestSkuCapacity -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
  if ($null -eq $selectedSkuCapacity) {
    Write-Warning "No availableCapacity found for candidate SKUs in $AccountLocation."
    Print-CapacityDebug -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
    return 2
  }
  $selectedSkuName = $selectedSkuCapacity.SkuName
  $availableCapacity = [int]$selectedSkuCapacity.Capacity
  $existingCapacity = Get-ExistingCapacityIfSameModel -DeploymentName $DeploymentName -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion -SkuName $selectedSkuName
  $targetCapacity = $availableCapacity + [int]$existingCapacity
  if ($targetCapacity -le 0) {
    Write-Warning "Max deployable capacity is $targetCapacity; skip '$DeploymentName'."
    Print-CapacityDebug -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
    return 2
  }

  Write-Host "Available capacity:           $availableCapacity"
  Write-Host "Selected SKU:                 $selectedSkuName"
  Write-Host "Existing same-model capacity: $existingCapacity"
  Write-Host "Target deployment capacity:   $targetCapacity"
  & az cognitiveservices account deployment create --name $AccountName --resource-group $ResourceGroup --deployment-name $DeploymentName --model-format $ModelFormat --model-name $ModelName --model-version $ModelVersion --sku-name $selectedSkuName --sku-capacity $targetCapacity -o jsonc
  if ($LASTEXITCODE -ne 0) { return 1 }
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

Login-AndSelectSubscription
Write-Host 'Current Azure account:'
& az account show --query "{subscriptionName:name, subscriptionId:id, state:state, user:user.name}" -o table
Ensure-ProviderRegistered
Ensure-ResourceGroup
Ensure-FoundryAccount
Ensure-FoundryProject

$BaseUrl = "https://management.azure.com/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.CognitiveServices/accounts/$AccountName/deployments"
$Models = @(
${modelRows}
)
$FinalDeploymentsUrl = $BaseUrl + '?api-version=' + $DeploymentApiVersion

foreach ($item in $Models) {
  $parts = $item -split '\\|', 4
  if ($parts.Count -lt 4) { continue }
  $rc = Deploy-ModelWithMaxCapacity -DeploymentName $parts[0] -ModelFormat $parts[1] -ModelName $parts[2] -ModelVersion $parts[3]
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

Write-Host ''
Write-Host "Final deployments under account '$AccountName'"
Invoke-AzureCliQuiet -Arguments @('rest','--method','get','--url',$FinalDeploymentsUrl,'--query','value[].{deploymentName:name,modelName:properties.model.name,modelVersion:properties.model.version,sku:sku.name,capacity:sku.capacity,state:properties.provisioningState,raiPolicy:properties.raiPolicyName}','-o','table')

Print-CopyableModelImportList
Print-AccountKeySummary
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
    input.servicePrincipal
  );
}

export function buildAzureCliPowerShellMultiRegionDeploymentScript(
  input: AzureCliMultiRegionDeploymentInput
): string {
  const subscriptionId = input.subscriptionId?.trim() || '';
  const resourceGroupName = input.resourceGroupName.trim();
  const targets = input.targets.filter((target) => target.models.length > 0);

  if (!subscriptionId && !hasCompleteServicePrincipal(input.servicePrincipal)) {
    throw new Error('subscriptionId or complete servicePrincipal is required');
  }
  if (!resourceGroupName) {
    throw new Error('resourceGroupName is required');
  }
  if (targets.length === 0) {
    throw new Error('targets are required');
  }

  return targets
    .map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliPowerShellDeploymentScript({
        subscriptionId,
        servicePrincipal: input.servicePrincipal,
        resourceGroupName,
        resourceName: target.resourceName,
        location: target.location,
        foundryProjectEndpoint: target.foundryProjectEndpoint,
        models: target.models,
      });

      return [
        `# ============================================================`,
        `# ${label.replace(/\r?\n/g, ' ')}`,
        `# ============================================================`,
        script,
      ].join('\n');
    })
    .join('\n\n');
}
