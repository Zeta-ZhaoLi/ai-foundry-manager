import { getDefaultProjectIdFromResourceName } from './common';

export interface AzureCliDeploymentModel {
  deploymentName: string;
  modelFormat: string;
  modelName: string;
  version: string;
}

export interface AzureCliDeploymentInput {
  subscriptionId: string;
  resourceName: string;
  foundryProjectEndpoint?: string;
  models: AzureCliDeploymentModel[];
}

export interface AzureCliDeploymentIdentity {
  subscriptionId: string;
  resourceGroup: string;
  accountName: string;
  projectId: string;
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

function shellDoubleQuote(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
}

function deriveIdentity(
  input: AzureCliDeploymentInput
): AzureCliDeploymentIdentity | null {
  const subscriptionId = input.subscriptionId.trim();
  const resourceName = input.resourceName.trim();
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

  if (!subscriptionId || !accountName || !projectId) return null;

  return {
    subscriptionId,
    resourceGroup: `rg-${projectId}`,
    accountName,
    projectId,
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

  if (!input.subscriptionId.trim()) errors.push('subscriptionId is required');
  if (!input.resourceName.trim()) errors.push('resourceName is required');
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

  const modelRows = stringifyAzureCliModelRows(input.models);

  return `# 部署方法：保存为 deploy-models.sh 后执行：
# ${AZURE_CLI_DEPLOYMENT_COMMAND.split('\n').join('\n# ')}

#!/usr/bin/env bash
set -uo pipefail

# ============================================================
# Basic configuration
# ============================================================
SUBSCRIPTION_ID="${shellDoubleQuote(identity.subscriptionId)}" #订阅 ID
RESOURCE_GROUP="${shellDoubleQuote(identity.resourceGroup)}" #资源组
ACCOUNT_NAME="${shellDoubleQuote(identity.accountName)}" #项目名

DEPLOYMENT_API_VERSION="2025-09-01"
CAPACITY_API_VERSION="2024-10-01"

SKU_NAME="GlobalStandard"
RAI_POLICY_NAME="Microsoft.Nil"
VERSION_UPGRADE_OPTION="OnceNewDefaultVersionAvailable"

# false = deployment 已存在时跳过，防止覆盖
# true  = deployment 已存在时更新
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
echo "Setting subscription: \${SUBSCRIPTION_ID}"
if ! az account set --subscription "\${SUBSCRIPTION_ID}"; then
  echo "ERROR: Failed to set subscription."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required but not installed."
  echo "Azure Cloud Shell normally includes jq."
  exit 1
fi

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
# Account metadata
# ============================================================
ACCOUNT_LOCATION="$(az cognitiveservices account show \\
  -g "\${RESOURCE_GROUP}" \\
  -n "\${ACCOUNT_NAME}" \\
  --query "location" \\
  -o tsv 2>/dev/null || true)"

if [ -z "\${ACCOUNT_LOCATION}" ]; then
  echo "ERROR: Could not read account location."
  echo "Check RESOURCE_GROUP and ACCOUNT_NAME:"
  echo "  RESOURCE_GROUP=\${RESOURCE_GROUP}"
  echo "  ACCOUNT_NAME=\${ACCOUNT_NAME}"
  exit 1
fi

echo
echo "Account location: \${ACCOUNT_LOCATION}"

BASE_URL="https://management.azure.com/subscriptions/\${SUBSCRIPTION_ID}/resourceGroups/\${RESOURCE_GROUP}/providers/Microsoft.CognitiveServices/accounts/\${ACCOUNT_NAME}/deployments"
CAPACITY_URL="https://management.azure.com/subscriptions/\${SUBSCRIPTION_ID}/providers/Microsoft.CognitiveServices/modelCapacities"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "\${WORKDIR}"' EXIT

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

  az rest \\
    --method get \\
    --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    --query "name" \\
    -o tsv >/dev/null 2>&1
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
    --arg sku "\${SKU_NAME}" '
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

  local capacity_json
  capacity_json="$(az rest \\
    --method get \\
    --url "\${CAPACITY_URL}?api-version=\${CAPACITY_API_VERSION}&modelFormat=\${model_format}&modelName=\${model_name}&modelVersion=\${model_version}" \\
    -o json 2>/dev/null)"

  echo "\${capacity_json}" | jq -r \\
    --arg location "\${ACCOUNT_LOCATION}" \\
    --arg sku "\${SKU_NAME}" '
      [
        .value[]
        | select(((.location // .properties.location // "") | ascii_downcase) == ($location | ascii_downcase))
        | select(((.properties.skuName // .sku.name // .name // "") | ascii_downcase) == ($sku | ascii_downcase))
        | (.properties.availableCapacity // .availableCapacity // 0)
      ]
      | map(tonumber? // 0)
      | if length == 0 then empty else max | floor end
    '
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
      sku:properties.skuName,
      availableCapacity:properties.availableCapacity,
      modelName:properties.model.name,
      modelVersion:properties.model.version
    }" \\
    -o table 2>/dev/null || true
}

make_payload() {
  local deployment_name="$1"
  local model_format="$2"
  local model_name="$3"
  local model_version="$4"
  local capacity="$5"

  local payload_file="\${WORKDIR}/payload-\${deployment_name}.json"

  cat > "\${payload_file}" <<EOF
{
  "properties": {
    "model": {
      "format": "\${model_format}",
      "name": "\${model_name}",
      "version": "\${model_version}"
    },
    "versionUpgradeOption": "\${VERSION_UPGRADE_OPTION}",
    "raiPolicyName": "\${RAI_POLICY_NAME}"
  },
  "sku": {
    "name": "\${SKU_NAME}",
    "capacity": \${capacity}
  }
}
EOF

  echo "\${payload_file}"
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
  echo "SKU:             \${SKU_NAME}"
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

  local available_capacity
  available_capacity="$(get_available_capacity "\${model_format}" "\${model_name}" "\${model_version}")"
  local capacity_rc=$?

  if [ "\${capacity_rc}" -ne 0 ]; then
    echo "ERROR: Failed to query available capacity for \${model_name} \${model_version}."
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 1
  fi

  if [ -z "\${available_capacity}" ]; then
    echo "WARNING: No \${SKU_NAME} availableCapacity found for \${model_name} \${model_version} in \${ACCOUNT_LOCATION}."
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    echo "Skip '\${deployment_name}'."
    return 2
  fi

  if ! [[ "\${available_capacity}" =~ ^[0-9]+$ ]]; then
    echo "ERROR: Invalid available capacity value: \${available_capacity}"
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 1
  fi

  local existing_same_model_capacity
  existing_same_model_capacity="$(get_existing_capacity_if_same_model "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}")"

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
  echo "Existing same-model capacity:  \${existing_same_model_capacity}"
  echo "Target deployment capacity:    \${target_capacity}"

  local payload_file
  payload_file="$(make_payload "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}" "\${target_capacity}")"

  echo "Creating or updating deployment '\${deployment_name}'..."

  if ! az rest \\
    --method put \\
    --url "\${BASE_URL}/\${deployment_name}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    --headers "Content-Type=application/json" \\
    --body @"\${payload_file}" \\
    -o jsonc; then

    echo "ERROR: PUT failed for deployment '\${deployment_name}'."
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
`;
}
