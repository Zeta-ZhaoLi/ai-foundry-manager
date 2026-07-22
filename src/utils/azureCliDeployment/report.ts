export const BASH_REPORT_INITIALIZATION = `init_deployment_report() {
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
  : > "\${REPORT_PATH}"
}

init_deployment_report`;

export const BASH_REPORT_FUNCTIONS = `get_deployment_report_json() {
  az rest \\
    --method get \\
    --url "\${BASE_URL}?api-version=\${DEPLOYMENT_API_VERSION}" \\
    -o json 2>/dev/null | jq -c '
      [
        .value[]?
        | {
            deploymentName: (.name // ""),
            modelFormat: (.properties.model.format // ""),
            modelName: (.properties.model.name // ""),
            modelVersion: (.properties.model.version // ""),
            sku: (.sku.name // ""),
            capacity: (.sku.capacity // .properties.currentCapacity // 0),
            state: (.properties.provisioningState // ""),
            raiPolicy: (.properties.raiPolicyName // "")
          }
      ]
    ' 2>/dev/null || echo '[]'
}

print_copyable_model_import_list() {
  local model_list
  model_list="$(get_deployment_report_json | jq -r '
    [ .[] | select((.state | ascii_downcase) == "succeeded") | .modelName, .deploymentName ]
    | map(select(. != ""))
    | reduce .[] as $name ([]; if index($name) then . else . + [$name] end)
    | join(", ")
  ')"
  echo "Region: \${ACCOUNT_LOCATION}"
  echo "Available models: \${model_list:--}"
}

print_account_key_summary() {
  local key1
  local deployments_json
  key1="$(az cognitiveservices account keys list \\
    --name "\${ACCOUNT_NAME}" \\
    --resource-group "\${RESOURCE_GROUP}" \\
    --query "key1" \\
    -o tsv 2>/dev/null || true)"
  deployments_json="$(get_deployment_report_json)"
  echo "Foundry endpoint: https://\${ACCOUNT_NAME}.services.ai.azure.com/api/projects/\${PROJECT_NAME}"
  echo "OpenAI endpoint: https://\${ACCOUNT_NAME}.openai.azure.com"
  echo "AI Services endpoint: https://\${ACCOUNT_NAME}.services.ai.azure.com"
  echo "Account key: \${key1:--}"
  echo "Model information:"
  echo "\${deployments_json}" | jq -r '
    if length == 0 then "-"
    else .[] | "  \\(.deploymentName) | \\(.modelName) | \\(.modelFormat) | \\(.modelVersion) | SKU=\\(.sku) | capacity=\\(.capacity) | state=\\(.state)"
    end
  '
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
  deployments_json="$(get_deployment_report_json)"
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
      regions: [{
        region: $region,
        resourceName: $resourceName,
        foundryProjectEndpoint: $foundryProjectEndpoint,
        openaiEndpoint: $openaiEndpoint,
        aiServicesEndpoint: $aiServicesEndpoint,
        apiKey: $apiKey,
        deployments: $deployments
      }]
    }')"

  {
    echo
    echo "Region: \${ACCOUNT_LOCATION}"
    echo "Foundry endpoint: https://\${ACCOUNT_NAME}.services.ai.azure.com/api/projects/\${PROJECT_NAME}"
    echo "OpenAI endpoint: https://\${ACCOUNT_NAME}.openai.azure.com"
    echo "AI Services endpoint: https://\${ACCOUNT_NAME}.services.ai.azure.com"
    echo "Account key: \${key1:--}"
    echo "Available models:"
    echo "\${deployments_json}" | jq -r '[ .[] | select((.state | ascii_downcase) == "succeeded") | .modelName, .deploymentName ] | map(select(. != "")) | reduce .[] as $name ([]; if index($name) then . else . + [$name] end) | if length == 0 then "-" else join(", ") end'
    echo "Model information:"
    echo "\${deployments_json}" | jq -r 'if length == 0 then "-" else .[] | "  \\(.deploymentName) | \\(.modelName) | \\(.modelFormat) | \\(.modelVersion) | SKU=\\(.sku) | capacity=\\(.capacity) | state=\\(.state)" end'
    echo
    echo "AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN"
    echo "\${payload}"
    echo "AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END"
  } >> "\${REPORT_PATH}"
}`;

export const POWERSHELL_REPORT_FUNCTIONS = `function Get-DeploymentReportData {
  $json = Invoke-AzCliJson -Arguments @('rest','--method','get','--url',($BaseUrl + '?api-version=' + $DeploymentApiVersion),'-o','json') -QuietOnError
  $deployments = @()
  if ($json -and $json.value) {
    foreach ($item in @($json.value)) {
      $deployments += [pscustomobject]@{
        deploymentName = $item.name
        modelFormat = $item.properties.model.format
        modelName = $item.properties.model.name
        modelVersion = $item.properties.model.version
        sku = $item.sku.name
        capacity = if ($null -ne $item.sku.capacity) { $item.sku.capacity } else { $item.properties.currentCapacity }
        state = $item.properties.provisioningState
        raiPolicy = $item.properties.raiPolicyName
      }
    }
  }
  return ,$deployments
}

function Print-CopyableModelImportList {
  $deployments = Get-DeploymentReportData
  $names = New-Object System.Collections.Generic.List[string]
  foreach ($item in @($deployments)) {
    if ($item.state -ne 'Succeeded') { continue }
    foreach ($name in @($item.modelName, $item.deploymentName)) {
      if ($name -and -not $names.Contains($name)) { [void]$names.Add($name) }
    }
  }
  $availableModels = if ($names.Count -eq 0) { '-' } else { [string]::Join(', ', $names) }
  Write-Host "Region: $AccountLocation"
  Write-Host "Available models: $availableModels"
}

function Print-AccountKeySummary {
  $key1 = (& az cognitiveservices account keys list --name $AccountName --resource-group $ResourceGroup --query key1 -o tsv 2>$null)
  $deployments = Get-DeploymentReportData
  $displayKey = if ([string]::IsNullOrWhiteSpace($key1)) { '-' } else { $key1 }
  Write-Host "Foundry endpoint: https://$AccountName.services.ai.azure.com/api/projects/$ProjectName"
  Write-Host "OpenAI endpoint: https://$AccountName.openai.azure.com"
  Write-Host "AI Services endpoint: https://$AccountName.services.ai.azure.com"
  Write-Host "Account key: $displayKey"
  Write-Host 'Model information:'
  if (-not $deployments -or $deployments.Count -eq 0) { Write-Host '-' } else {
    foreach ($deployment in @($deployments)) {
      Write-Host "  $($deployment.deploymentName) | $($deployment.modelName) | $($deployment.modelFormat) | $($deployment.modelVersion) | SKU=$($deployment.sku) | capacity=$($deployment.capacity) | state=$($deployment.state)"
    }
  }
}

function Append-DeploymentReport {
  $key1 = (& az cognitiveservices account keys list --name $AccountName --resource-group $ResourceGroup --query key1 -o tsv 2>$null)
  $deployments = Get-DeploymentReportData
  $payload = [pscustomobject]@{
    schema = 'ai-foundry-manager.deployment-result.v1'
    subscriptionId = $SubscriptionId
    regions = @([pscustomobject]@{
      region = $AccountLocation
      resourceName = $AccountName
      foundryProjectEndpoint = "https://$AccountName.services.ai.azure.com/api/projects/$ProjectName"
      openaiEndpoint = "https://$AccountName.openai.azure.com"
      aiServicesEndpoint = "https://$AccountName.services.ai.azure.com"
      apiKey = $key1
      deployments = @($deployments)
    })
  } | ConvertTo-Json -Depth 10 -Compress

  $names = New-Object System.Collections.Generic.List[string]
  foreach ($item in @($deployments)) {
    if ($item.state -ne 'Succeeded') { continue }
    foreach ($name in @($item.modelName, $item.deploymentName)) {
      if ($name -and -not $names.Contains($name)) { [void]$names.Add($name) }
    }
  }
  $displayKey = if ([string]::IsNullOrWhiteSpace($key1)) { '-' } else { $key1 }
  $availableModels = if ($names.Count -eq 0) { '-' } else { [string]::Join(', ', $names) }
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add('')
  $lines.Add("Region: $AccountLocation")
  $lines.Add("Foundry endpoint: https://$AccountName.services.ai.azure.com/api/projects/$ProjectName")
  $lines.Add("OpenAI endpoint: https://$AccountName.openai.azure.com")
  $lines.Add("AI Services endpoint: https://$AccountName.services.ai.azure.com")
  $lines.Add("Account key: $displayKey")
  $lines.Add("Available models: $availableModels")
  $lines.Add('Model information:')
  if (-not $deployments -or $deployments.Count -eq 0) { $lines.Add('-') } else {
    foreach ($deployment in @($deployments)) { $lines.Add("  $($deployment.deploymentName) | $($deployment.modelName) | $($deployment.modelFormat) | $($deployment.modelVersion) | SKU=$($deployment.sku) | capacity=$($deployment.capacity) | state=$($deployment.state)") }
  }
  $lines.Add('')
  $lines.Add('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN')
  $lines.Add($payload)
  $lines.Add('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END')
  $lines | Add-Content -LiteralPath $script:ReportPath -Encoding UTF8
}`;

export const POWERSHELL_REPORT_INITIALIZATION = `function Initialize-DeploymentReport {
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
  Set-Content -LiteralPath $script:ReportPath -Value '' -Encoding UTF8
}

Initialize-DeploymentReport`;
