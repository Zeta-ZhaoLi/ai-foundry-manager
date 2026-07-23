import { shellDoubleQuote } from './escaping';
import { deriveIdentity, formatAccountIdentityComment } from './identity';
import { stringifyAzureCliModelRows } from './models';
import { BASH_REPORT_FUNCTIONS, BASH_REPORT_INITIALIZATION } from './report';
import {
  AZURE_CLI_DEPLOYMENT_COMMAND,
  type AzureCliDeploymentIdentity,
  type AzureCliDeploymentInput,
  type AzureCliMultiRegionDeploymentInput,
  type AzureCliServicePrincipal,
} from './types';
import { validateAzureCliDeploymentInput } from './validation';

function buildAzureCliDeploymentScriptBody(
  identity: AzureCliDeploymentIdentity,
  modelRows: string,
  servicePrincipal?: AzureCliServicePrincipal,
  accountEmail = '',
  overwriteExisting = false,
  accountId?: string,
  includeIdentityComment = true
): string {
  const configuredSubscriptionId = identity.subscriptionId;
  const sp = servicePrincipal;
  const overwriteDefault = overwriteExisting ? 'true' : 'false';
  const identityComment = formatAccountIdentityComment(accountId, accountEmail);
  return `${includeIdentityComment ? `${identityComment}\n` : ''}# Deployment method: save as deploy-models.sh, then run:
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

# all = prepare resources and deploy models
# prepare-only = prepare resources, skip model deployment
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
LAST_DEPLOYMENT_REASON=""
LAST_DEPLOYMENT_SKU=""
LAST_DEPLOYMENT_CAPACITY=""

print_section() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

print_status() {
  printf "  [%-7s] %s\\n" "$1" "$2"
}

start_model_progress() {
  local message="$1"
  if [ -t 1 ]; then
    printf "\\r%-160s" "\${message} | RUNNING"
  else
    echo "\${message} | RUNNING"
  fi
}

finish_model_progress() {
  local message="$1"
  if [ -t 1 ]; then
    printf "\\r%-160s\\n" "\${message}"
  else
    echo "\${message}"
  fi
}

join_model_names() {
  local output=""
  local name
  for name in "$@"; do
    if [ -n "\${output}" ]; then
      output="\${output}, "
    fi
    output="\${output}\${name}"
  done
  echo "\${output}"
}

print_deployment_summary() {
  local label="Deployment summary"
  if [ "\${AZURE_FOUNDRY_DEFER_REPORT_NOTICE:-}" = "true" ]; then
    label="Region summary (\${ACCOUNT_LOCATION})"
  fi
  echo
  echo "\${label}: succeeded=\${#SUCCEEDED_DEPLOYMENTS[@]}, skipped=\${#SKIPPED_DEPLOYMENTS[@]}, failed=\${#FAILED_DEPLOYMENTS[@]}"
  if [ "\${#SKIPPED_DEPLOYMENTS[@]}" -gt 0 ]; then
    echo "Skipped models: $(join_model_names "\${SKIPPED_DEPLOYMENTS[@]}")"
  fi
  if [ "\${#FAILED_DEPLOYMENTS[@]}" -gt 0 ]; then
    echo "Failed models: $(join_model_names "\${FAILED_DEPLOYMENTS[@]}")"
  fi
  if [ "\${AZURE_FOUNDRY_DEFER_REPORT_NOTICE:-}" != "true" ]; then
    echo "Result file: \${REPORT_PATH}"
  fi
}

add_region_totals() {
  local succeeded="\${#SUCCEEDED_DEPLOYMENTS[@]}"
  local skipped="\${#SKIPPED_DEPLOYMENTS[@]}"
  local failed="\${#FAILED_DEPLOYMENTS[@]}"
  export AZURE_FOUNDRY_TOTAL_SUCCEEDED="$((\${AZURE_FOUNDRY_TOTAL_SUCCEEDED:-0} + succeeded))"
  export AZURE_FOUNDRY_TOTAL_SKIPPED="$((\${AZURE_FOUNDRY_TOTAL_SKIPPED:-0} + skipped))"
  export AZURE_FOUNDRY_TOTAL_FAILED="$((\${AZURE_FOUNDRY_TOTAL_FAILED:-0} + failed))"
}

# ============================================================
# Preflight
# ============================================================
install_azure_cli_if_missing() {
  if command -v az >/dev/null 2>&1; then
    return 0
  fi

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

print_section "Prerequisites"
print_status "RUNNING" "Checking Azure CLI"
install_azure_cli_if_missing
print_status "OK" "Azure CLI is available"
print_status "RUNNING" "Checking jq"
install_jq_if_missing
print_status "OK" "jq is available"

login_and_select_subscription() {
  print_section "Authentication"
  if [ -n "\${SP_APP_ID}" ] || [ -n "\${SP_PASSWORD}" ] || [ -n "\${SP_TENANT}" ]; then
    if [ -z "\${SP_APP_ID}" ] || [ -z "\${SP_PASSWORD}" ] || [ -z "\${SP_TENANT}" ]; then
      echo "ERROR: Service Principal requires appId, password, and tenant."
      exit 1
    fi

    print_status "RUNNING" "Signing in with Service Principal"
    if ! az login --service-principal --username "\${SP_APP_ID}" --password "\${SP_PASSWORD}" --tenant "\${SP_TENANT}" -o none; then
      echo "ERROR: Service Principal login failed."
      exit 1
    fi
    print_status "OK" "Service Principal login succeeded"
  else
    print_status "INFO" "Using the current Azure CLI login"
  fi

  if [ -n "\${CONFIGURED_SUBSCRIPTION_ID}" ]; then
    SUBSCRIPTION_ID="\${CONFIGURED_SUBSCRIPTION_ID}"
  elif [ "\${AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID:-}" = "true" ] && [ -n "\${AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID:-}" ]; then
    SUBSCRIPTION_ID="\${AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID}"
  else
    local all_subscriptions_json
    local subscriptions_json
    local subscription_count

    all_subscriptions_json="$(az account list --query "[].{id:id,name:name,state:state,tenantId:tenantId,isDefault:isDefault}" -o json)"
    subscriptions_json="$(echo "\${all_subscriptions_json}" | jq '[.[] | select(.state == "Enabled")]')"
    subscription_count="$(echo "\${subscriptions_json}" | jq 'length')"

    if [ "\${subscription_count}" -eq 0 ]; then
      if [ "$(echo "\${all_subscriptions_json}" | jq 'length')" -eq 0 ]; then
        :
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

  if ! az account set --subscription "\${SUBSCRIPTION_ID}"; then
    echo "ERROR: Failed to set subscription."
    exit 1
  fi
  print_status "OK" "Selected subscription: \${SUBSCRIPTION_ID}"

  if [ "\${AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID:-}" = "true" ]; then
    export AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID="\${SUBSCRIPTION_ID}"
  fi
}

login_and_select_subscription

${BASH_REPORT_INITIALIZATION}

# ============================================================
# Provider registration
# ============================================================
ensure_provider_registered() {
  local provider_state

  provider_state="$(az provider show \\
    --namespace Microsoft.CognitiveServices \\
    --query "registrationState" \\
    -o tsv 2>/dev/null || echo "NotRegistered")"

  if [ "\${provider_state}" = "Registered" ]; then
    print_status "OK" "Microsoft.CognitiveServices is registered"
    return 0
  fi

  if [ "\${AUTO_REGISTER_PROVIDER}" != "true" ]; then
    echo "WARNING: Provider is not registered and AUTO_REGISTER_PROVIDER=false."
    return 1
  fi

  print_status "RUNNING" "Registering Microsoft.CognitiveServices"
  if ! az provider register --namespace Microsoft.CognitiveServices -o none; then
    echo "WARNING: Failed to start provider registration."
    echo "This usually means the current identity lacks subscription-level permission."
    return 1
  fi

  for attempt in $(seq 1 60); do
    provider_state="$(az provider show \\
      --namespace Microsoft.CognitiveServices \\
      --query "registrationState" \\
      -o tsv 2>/dev/null || echo "Unknown")"

    if [ "\${provider_state}" = "Registered" ]; then
      print_status "OK" "Microsoft.CognitiveServices registration completed"
      return 0
    fi

    sleep 10
  done

  echo "WARNING: Provider registration did not reach Registered in time."
  return 1
}

print_section "Provider"
ensure_provider_registered || true

# ============================================================
# Resource and project setup
# ============================================================
ensure_resource_group() {
  if az group show --name "\${RESOURCE_GROUP}" -o none 2>/dev/null; then
    print_status "EXISTS" "Resource group: \${RESOURCE_GROUP}"
    return 0
  fi

  print_status "RUNNING" "Creating resource group: \${RESOURCE_GROUP}"
  if az group create \\
    --name "\${RESOURCE_GROUP}" \\
    --location "\${RESOURCE_GROUP_LOCATION}" \\
    -o none; then
    print_status "CREATED" "Resource group: \${RESOURCE_GROUP}"
    return 0
  fi
  print_status "FAILED" "Resource group: \${RESOURCE_GROUP}"
  return 1
}

ensure_foundry_account() {
  local account_json
  if az cognitiveservices account show \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    -o none 2>/dev/null; then
    print_status "EXISTS" "Foundry account: \${ACCOUNT_NAME}"
  else
    print_status "RUNNING" "Creating Foundry account: \${ACCOUNT_NAME}"
    if ! az cognitiveservices account create \\
      --name "\${ACCOUNT_NAME}" \\
      --resource-group "\${RESOURCE_GROUP}" \\
      --kind AIServices \\
      --sku s0 \\
      --location "\${ACCOUNT_LOCATION}" \\
      --allow-project-management \\
      -o none; then
      print_status "FAILED" "Foundry account: \${ACCOUNT_NAME}"
    else
      print_status "CREATED" "Foundry account: \${ACCOUNT_NAME}"
    fi
  fi

  account_json="$(az cognitiveservices account show \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    -o json 2>/dev/null || true)"

  local existing_custom_domain
  existing_custom_domain="$(echo "\${account_json}" | jq -r '.properties.customSubDomainName // .properties.customSubdomainName // .customSubDomainName // ""' 2>/dev/null || true)"

  if [ -n "\${existing_custom_domain}" ]; then
    print_status "OK" "Custom domain: \${existing_custom_domain}"
    return 0
  fi

  local custom_domain_error
  custom_domain_error="$(mktemp)"
  if az cognitiveservices account update \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --custom-domain "\${ACCOUNT_NAME}" \\
    -o none 2>"\${custom_domain_error}"; then
    rm -f "\${custom_domain_error}"
    print_status "CREATED" "Custom domain: \${ACCOUNT_NAME}"
    return 0
  fi

  echo "WARNING: Could not set custom domain for '\${ACCOUNT_NAME}'."
  cat "\${custom_domain_error}" >&2
  rm -f "\${custom_domain_error}"
  return 2
}

ensure_foundry_project() {
  if az cognitiveservices account project show \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --project-name "\${PROJECT_NAME}" \\
    -o none 2>/dev/null; then
    print_status "EXISTS" "Foundry project: \${PROJECT_NAME}"
    return 0
  fi

  print_status "RUNNING" "Creating Foundry project: \${PROJECT_NAME}"
  local project_error
  project_error="$(mktemp)"
  if az cognitiveservices account project create \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --project-name "\${PROJECT_NAME}" \\
    --location "\${ACCOUNT_LOCATION}" \\
    -o none 2>"\${project_error}"; then
    rm -f "\${project_error}"
    print_status "CREATED" "Foundry project: \${PROJECT_NAME}"
    return 0
  fi

  echo "WARNING: Could not create Foundry project '\${PROJECT_NAME}'."
  cat "\${project_error}" >&2
  rm -f "\${project_error}"
  return 2
}

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

  echo "\${SKU_NAME}|\${capacity}"
}

print_capacity_debug() {
  :
}

${BASH_REPORT_FUNCTIONS}

prepare_account_resources() {
  print_section "Resources - \${ACCOUNT_LOCATION}"
  echo "Account: \${ACCOUNT_NAME}"
  echo "Resource group: \${RESOURCE_GROUP}"
  echo "Region: \${ACCOUNT_LOCATION}"
  ensure_resource_group
  local account_rc=0
  ensure_foundry_account || account_rc=$?
  if [ "\${account_rc}" -eq 0 ]; then
    ensure_foundry_project || true
  fi
}

wait_until_succeeded() {
  local deployment_name="$1"
  local max_attempts="\${2:-120}"
  local sleep_seconds="\${3:-10}"

  for attempt in $(seq 1 "\${max_attempts}"); do
    local state
    state="$(get_deployment_state "\${deployment_name}")"

    case "\${state}" in
      Succeeded)
        return 0
        ;;
      Failed|Canceled|Cancelled)
        LAST_DEPLOYMENT_REASON="deployment state: \${state}"
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

  LAST_DEPLOYMENT_REASON="deployment timed out"
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
  LAST_DEPLOYMENT_REASON=""
  LAST_DEPLOYMENT_SKU=""
  LAST_DEPLOYMENT_CAPACITY=""

  local deployment_already_exists="false"
  if deployment_exists "\${deployment_name}"; then
    deployment_already_exists="true"
    if [ "\${OVERWRITE_EXISTING}" != "true" ]; then
      LAST_DEPLOYMENT_REASON="already exists, overwrite disabled"
      return 2
    fi

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
        available_capacity="$(get_available_capacity "\${model_format}" "\${model_name}" "\${model_version}" "\${SKU_NAME}")"
        capacity_rc=$?
        if [ "\${capacity_rc}" -ne 0 ]; then
          LAST_DEPLOYMENT_REASON="capacity query failed"
          echo "ERROR: Failed to query available capacity for \${SKU_NAME}."
          print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
          return 1
        fi
        if [ -z "\${available_capacity}" ]; then
          available_capacity="0"
        fi
      else
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
        LAST_DEPLOYMENT_REASON="no \${SKU_NAME} capacity record"
        print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
        return 2
      fi
      LAST_DEPLOYMENT_REASON="capacity query failed"
      echo "ERROR: Failed to query available capacity for \${model_name} \${model_version}."
      print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
      return 1
    fi

    IFS='|' read -r selected_sku available_capacity <<< "\${selected_sku_capacity}"
    existing_same_model_capacity="$(get_existing_capacity_if_same_model "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}" "\${selected_sku}")"
  fi

  if ! [[ "\${available_capacity}" =~ ^[0-9]+$ ]]; then
    LAST_DEPLOYMENT_REASON="invalid available capacity"
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
      target_capacity="\${configured_max_capacity}"
    fi
  fi

  if [ "\${target_capacity}" -le 0 ]; then
    LAST_DEPLOYMENT_REASON="no available capacity"
    print_capacity_debug "\${model_format}" "\${model_name}" "\${model_version}"
    return 2
  fi

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
    -o none; then

    LAST_DEPLOYMENT_REASON="deployment request failed"
    echo "ERROR: Azure CLI deployment PUT failed for '\${deployment_name}'."
    return 1
  fi

  if ! wait_until_succeeded "\${deployment_name}"; then
    if [ -z "\${LAST_DEPLOYMENT_REASON}" ]; then
      LAST_DEPLOYMENT_REASON="deployment did not succeed"
    fi
    echo "ERROR: Deployment '\${deployment_name}' did not reach Succeeded."
    return 1
  fi

  LAST_DEPLOYMENT_SKU="\${selected_sku}"
  LAST_DEPLOYMENT_CAPACITY="\${target_capacity}"
  return 0
}

deploy_all_models() {
  # ============================================================
  # Main deployment loop
  # ============================================================
  print_section "Models - \${ACCOUNT_LOCATION}"
  local model_total="\${#MODELS[@]}"
  local model_index=0
  echo "Models selected: \${model_total}"
  for item in "\${MODELS[@]}"; do
    model_index=$((model_index + 1))
    IFS='|' read -r deployment_name model_format model_name model_version configured_max_capacity <<< "\${item}"
    local progress_prefix
    printf -v progress_prefix "[%02d/%02d] %s" "\${model_index}" "\${model_total}" "\${deployment_name}"
    start_model_progress "\${progress_prefix}"

    deploy_model_with_max_capacity "\${deployment_name}" "\${model_format}" "\${model_name}" "\${model_version}" "\${configured_max_capacity:-0}"
    rc=$?

    case "\${rc}" in
      0)
        SUCCEEDED_DEPLOYMENTS+=("\${deployment_name}")
        finish_model_progress "\${progress_prefix} | SUCCESS | SKU=\${LAST_DEPLOYMENT_SKU} | capacity=\${LAST_DEPLOYMENT_CAPACITY}"
        ;;
      2)
        SKIPPED_DEPLOYMENTS+=("\${deployment_name}")
        finish_model_progress "\${progress_prefix} | SKIPPED | \${LAST_DEPLOYMENT_REASON:-not deployable}"
        ;;
      *)
        FAILED_DEPLOYMENTS+=("\${deployment_name}")
        finish_model_progress "\${progress_prefix} | FAILED | \${LAST_DEPLOYMENT_REASON:-unknown error}"
        ;;
    esac

  done
}

if [ "\${DEPLOYMENT_RUN_MODE}" != "deploy-only" ]; then
  prepare_account_resources
fi

if [ "\${DEPLOYMENT_RUN_MODE}" != "prepare-only" ]; then
  deploy_all_models
  append_deployment_report
  print_deployment_summary
  if [ "\${AZURE_FOUNDRY_DEFER_REPORT_NOTICE:-}" = "true" ]; then
    add_region_totals
  fi
fi
${includeIdentityComment ? `\n${identityComment}` : ''}
`.trimEnd();
}

function buildAzureCliDeploymentScriptInternal(
  input: AzureCliDeploymentInput,
  includeIdentityComment: boolean
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
    input.overwriteExisting,
    input.accountId,
    includeIdentityComment
  );
}

export function buildAzureCliDeploymentScript(
  input: AzureCliDeploymentInput
): string {
  return buildAzureCliDeploymentScriptInternal(input, true);
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

  const identityComment = formatAccountIdentityComment(
    input.accountId,
    input.accountEmail
  );
  return [
    identityComment,
    'unset AZURE_FOUNDRY_REPORT_PATH',
    'unset AZURE_FOUNDRY_REPORT_TIMESTAMP',
    'unset AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID',
    'export AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID="true"',
    'export AZURE_FOUNDRY_DEFER_REPORT_NOTICE="true"',
    'export AZURE_FOUNDRY_TOTAL_SUCCEEDED="0"',
    'export AZURE_FOUNDRY_TOTAL_SKIPPED="0"',
    'export AZURE_FOUNDRY_TOTAL_FAILED="0"',
    'echo',
    'echo "============================================================"',
    'echo "Azure AI Foundry multi-region deployment"',
    'echo "============================================================"',
    `echo "Account: ${shellDoubleQuote(input.accountId?.trim() || '-')} | Email: ${shellDoubleQuote(input.accountEmail || '')}"`,
    `echo "Regions: ${targets.length}"`,
    '# ============================================================',
    '# Prepare all selected regions first',
    '# ============================================================',
    ...targets.map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliDeploymentScriptInternal(
        {
          subscriptionId,
          accountId: input.accountId,
          servicePrincipal: input.servicePrincipal,
          accountEmail: input.accountEmail,
          resourceGroupName,
          resourceName: target.resourceName,
          location: target.location,
          foundryProjectEndpoint: target.foundryProjectEndpoint,
          models: target.models,
          overwriteExisting: input.overwriteExisting,
        },
        false
      );

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
      const script = buildAzureCliDeploymentScriptInternal(
        {
          subscriptionId,
          accountId: input.accountId,
          servicePrincipal: input.servicePrincipal,
          accountEmail: input.accountEmail,
          resourceGroupName,
          resourceName: target.resourceName,
          location: target.location,
          foundryProjectEndpoint: target.foundryProjectEndpoint,
          models: target.models,
          overwriteExisting: input.overwriteExisting,
        },
        false
      );

      return [
        `# ============================================================`,
        `# Deploy ${shellDoubleQuote(label)}`,
        `# ============================================================`,
        'export AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE="deploy-only"',
        script,
      ].join('\n');
    }),
    'echo',
    'echo "============================================================"',
    'echo "Summary"',
    'echo "============================================================"',
    'echo "Deployment summary: succeeded=${AZURE_FOUNDRY_TOTAL_SUCCEEDED:-0}, skipped=${AZURE_FOUNDRY_TOTAL_SKIPPED:-0}, failed=${AZURE_FOUNDRY_TOTAL_FAILED:-0}"',
    'echo "Result file: ${AZURE_FOUNDRY_REPORT_PATH}"',
    'unset AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE',
    'unset AZURE_FOUNDRY_DEFER_REPORT_NOTICE',
    'unset AZURE_FOUNDRY_TOTAL_SUCCEEDED',
    'unset AZURE_FOUNDRY_TOTAL_SKIPPED',
    'unset AZURE_FOUNDRY_TOTAL_FAILED',
    'unset AZURE_FOUNDRY_REPORT_PATH',
    'unset AZURE_FOUNDRY_REPORT_TIMESTAMP',
    'unset AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID',
    'unset AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID',
    'unset AZURE_CONFIG_DIR',
    identityComment,
  ].join('\n\n');
}
