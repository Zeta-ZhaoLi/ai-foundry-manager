export const BASH_REPORT_INITIALIZATION = `init_deployment_report() {
  if [ -z "\${AZURE_FOUNDRY_TABLE_DIR:-}" ]; then
    AZURE_FOUNDRY_TABLE_DIR="$(mktemp -d "\${TMPDIR:-/tmp}/ai-foundry-manager-tables.XXXXXX")"
    export AZURE_FOUNDRY_TABLE_DIR
  fi
  mkdir -p "\${AZURE_FOUNDRY_TABLE_DIR}"

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

render_deployment_tables() {
  local model_file="\${AZURE_FOUNDRY_TABLE_DIR}/models.tsv"
  local region_file="\${AZURE_FOUNDRY_TABLE_DIR}/regions.tsv"
  echo
  echo "Deployment model summary"
  echo "========================"
  if [ -s "\${model_file}" ]; then
    awk -F '\\t' '
      function dash(width, value) { value=sprintf("%*s", width, ""); gsub(/ /, "-", value); return value }
      { rows[NR]=$0; for (i=1; i<=NF; i++) if (length($i)>widths[i]) widths[i]=length($i); count=NR }
      END {
        split("Region|DeploymentName|ModelName|ModelVersion|SKU|Capacity|State|RaiPolicy", headers, "|")
        for (i=1; i<=8; i++) if (length(headers[i])>widths[i]) widths[i]=length(headers[i])
        for (i=1; i<=8; i++) printf("%-*s%s", widths[i], headers[i], i<8 ? " | " : "\\n")
        for (i=1; i<=8; i++) printf("%s%s", dash(widths[i]), i<8 ? "-+-" : "\\n")
        for (row=1; row<=count; row++) {
          split(rows[row], values, FS)
          for (i=1; i<=8; i++) printf("%-*s%s", widths[i], values[i], i<8 ? " | " : "\\n")
        }
      }
    ' "\${model_file}"
  else
    echo "(no deployment records)"
  fi

  echo
  echo "Region information"
  echo "=================="
  if [ -s "\${region_file}" ]; then
    awk -F '\\t' '
      function dash(width, value) { value=sprintf("%*s", width, ""); gsub(/ /, "-", value); return value }
      { rows[NR]=$0; for (i=1; i<=NF; i++) if (length($i)>widths[i]) widths[i]=length($i); count=NR }
      END {
        split("Region|Foundry Endpoint|OpenAI Endpoint|AI Services Endpoint|API Key", headers, "|")
        for (i=1; i<=5; i++) if (length(headers[i])>widths[i]) widths[i]=length(headers[i])
        for (i=1; i<=5; i++) printf("%-*s%s", widths[i], headers[i], i<5 ? " | " : "\\n")
        for (i=1; i<=5; i++) printf("%s%s", dash(widths[i]), i<5 ? "-+-" : "\\n")
        for (row=1; row<=count; row++) {
          split(rows[row], values, FS)
          for (i=1; i<=5; i++) printf("%-*s%s", widths[i], values[i], i<5 ? " | " : "\\n")
        }
      }
    ' "\${region_file}"
  else
    echo "(no region records)"
  fi
}

print_deployment_tables() {
  render_deployment_tables
}

write_deployment_report() {
  render_deployment_tables > "\${REPORT_PATH}"

  {
    echo
    echo "Available models:"
    echo "================="
    if [ -s "\${AZURE_FOUNDRY_TABLE_DIR}/available-models.tsv" ]; then
      awk -F '\\t' '
        $1 != current_region {
          if (NR > 1) print ""
          current_region=$1
          print current_region ":"
        }
        { print "  - " $2 }
      ' "\${AZURE_FOUNDRY_TABLE_DIR}/available-models.tsv"
    else
      echo "-"
    fi
    echo
    if [ -s "\${AZURE_FOUNDRY_TABLE_DIR}/payloads.txt" ]; then
      cat "\${AZURE_FOUNDRY_TABLE_DIR}/payloads.txt"
    fi
  } >> "\${REPORT_PATH}"
}

cleanup_deployment_table_data() {
  if [ -n "\${AZURE_FOUNDRY_TABLE_DIR:-}" ] && [ -d "\${AZURE_FOUNDRY_TABLE_DIR}" ]; then
    rm -rf -- "\${AZURE_FOUNDRY_TABLE_DIR}"
  fi
  unset AZURE_FOUNDRY_TABLE_DIR
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
  deployments_json="$(get_deployment_report_json | jq -c 'sort_by(.deploymentName)')"
  echo "\${deployments_json}" | jq -r --arg region "\${ACCOUNT_LOCATION}" '.[] | [$region, (.deploymentName // ""), (.modelName // ""), (.modelVersion // ""), (.sku // ""), ((.capacity // 0) | tostring), (.state // ""), (.raiPolicy // "")] | @tsv' >> "\${AZURE_FOUNDRY_TABLE_DIR}/models.tsv"
  printf '%s\\t%s\\t%s\\t%s\\t%s\\n' \
    "\${ACCOUNT_LOCATION}" \
    "https://\${ACCOUNT_NAME}.services.ai.azure.com/api/projects/\${PROJECT_NAME}" \
    "https://\${ACCOUNT_NAME}.openai.azure.com" \
    "https://\${ACCOUNT_NAME}.services.ai.azure.com" \
    "\${key1:--}" >> "\${AZURE_FOUNDRY_TABLE_DIR}/regions.tsv"
  echo "\${deployments_json}" | jq -r --arg region "\${ACCOUNT_LOCATION}" '[ .[] | select((.state | ascii_downcase) == "succeeded") | .modelName, .deploymentName ] | map(select(. != "")) | reduce .[] as $name ([]; if index($name) then . else . + [$name] end) | if length == 0 then ["-"] else . end | .[] | [$region, .] | @tsv' >> "\${AZURE_FOUNDRY_TABLE_DIR}/available-models.tsv"
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
    echo "AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN"
    echo "\${payload}"
    echo "AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END"
  } >> "\${AZURE_FOUNDRY_TABLE_DIR}/payloads.txt"
  write_deployment_report
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
  return $deployments
}

function Write-AsciiTable {
  param(
    [string]$Title,
    [string[]]$Headers,
    [string[]]$Properties,
    [object[]]$Rows,
    [string]$OutputPath
  )
  $items = @($Rows | Where-Object { $null -ne $_ })
  $lines = New-Object System.Collections.Generic.List[string]
  [void]$lines.Add('')
  [void]$lines.Add($Title)
  [void]$lines.Add('=' * $Title.Length)
  $widths = @()
  for ($i = 0; $i -lt $Headers.Count; $i++) {
    $width = $Headers[$i].Length
    foreach ($row in $items) {
      $value = [string]$row.($Properties[$i])
      if ($value.Length -gt $width) { $width = $value.Length }
    }
    $widths += $width
  }
  $headerCells = for ($i = 0; $i -lt $Headers.Count; $i++) { $Headers[$i].PadRight($widths[$i]) }
  [void]$lines.Add($headerCells -join ' | ')
  $separatorCells = for ($i = 0; $i -lt $widths.Count; $i++) { '-' * $widths[$i] }
  [void]$lines.Add($separatorCells -join '-+-')
  foreach ($row in $items) {
    $cells = for ($i = 0; $i -lt $Properties.Count; $i++) {
      ([string]$row.($Properties[$i])).PadRight($widths[$i])
    }
    [void]$lines.Add($cells -join ' | ')
  }
  if ($items.Count -eq 0) { [void]$lines.Add('(no records)') }
  if ($OutputPath) {
    $lines | Add-Content -LiteralPath $OutputPath -Encoding UTF8
  } else {
    foreach ($line in $lines) { Write-Host $line }
  }
}

function Write-DeploymentTables {
  param([string]$OutputPath)
  $modelPath = Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'models.tsv'
  $modelObjects = foreach ($line in @(Get-Content -LiteralPath $modelPath -ErrorAction SilentlyContinue)) {
    $row = $line -split "\`t", -1
    [pscustomobject]@{
      Region = $row[0]
      DeploymentName = $row[1]
      ModelName = $row[2]
      ModelVersion = $row[3]
      SKU = $row[4]
      Capacity = $row[5]
      State = $row[6]
      RaiPolicy = $row[7]
    }
  }
  Write-AsciiTable -Title 'Deployment model summary' -Headers @('Region','DeploymentName','ModelName','ModelVersion','SKU','Capacity','State','RaiPolicy') -Properties @('Region','DeploymentName','ModelName','ModelVersion','SKU','Capacity','State','RaiPolicy') -Rows $modelObjects -OutputPath $OutputPath

  $regionPath = Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'regions.tsv'
  $regionObjects = foreach ($line in @(Get-Content -LiteralPath $regionPath -ErrorAction SilentlyContinue)) {
    $row = $line -split "\`t", -1
    [pscustomobject]@{
      Region = $row[0]
      FoundryEndpoint = $row[1]
      OpenAIEndpoint = $row[2]
      AIServicesEndpoint = $row[3]
      APIKey = $row[4]
    }
  }
  Write-AsciiTable -Title 'Region information' -Headers @('Region','Foundry Endpoint','OpenAI Endpoint','AI Services Endpoint','API Key') -Properties @('Region','FoundryEndpoint','OpenAIEndpoint','AIServicesEndpoint','APIKey') -Rows $regionObjects -OutputPath $OutputPath
}

function Write-DeploymentReport {
  Set-Content -LiteralPath $script:ReportPath -Value '' -Encoding UTF8
  Write-DeploymentTables -OutputPath $script:ReportPath
  Add-Content -LiteralPath $script:ReportPath -Value @('', 'Available models:', '=================') -Encoding UTF8
  $availablePath = Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'available-models.tsv'
  $currentRegion = ''
  foreach ($line in @(Get-Content -LiteralPath $availablePath -ErrorAction SilentlyContinue)) {
    $row = $line -split "\`t", 2
    if ($row[0] -ne $currentRegion) {
      if ($currentRegion) { Add-Content -LiteralPath $script:ReportPath -Value '' -Encoding UTF8 }
      $currentRegion = $row[0]
      Add-Content -LiteralPath $script:ReportPath -Value ($currentRegion + ':') -Encoding UTF8
    }
    Add-Content -LiteralPath $script:ReportPath -Value ('  - ' + $row[1]) -Encoding UTF8
  }
  if (-not $currentRegion) { Add-Content -LiteralPath $script:ReportPath -Value '-' -Encoding UTF8 }
  Add-Content -LiteralPath $script:ReportPath -Value '' -Encoding UTF8
  $payloadPath = Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'payloads.txt'
  if (Test-Path -LiteralPath $payloadPath) {
    Get-Content -LiteralPath $payloadPath | Add-Content -LiteralPath $script:ReportPath -Encoding UTF8
  }
}

function Remove-DeploymentTableData {
  if ($env:AZURE_FOUNDRY_TABLE_DIR -and (Test-Path -LiteralPath $env:AZURE_FOUNDRY_TABLE_DIR)) {
    Remove-Item -LiteralPath $env:AZURE_FOUNDRY_TABLE_DIR -Recurse -Force -ErrorAction SilentlyContinue
  }
  Remove-Item Env:AZURE_FOUNDRY_TABLE_DIR -ErrorAction SilentlyContinue
}

function Append-DeploymentReport {
  $key1 = (& az cognitiveservices account keys list --name $AccountName --resource-group $ResourceGroup --query key1 -o tsv 2>$null)
  $deployments = @(Get-DeploymentReportData | Sort-Object -Property deploymentName)
  foreach ($deployment in @($deployments)) {
    $modelRow = @(
      $AccountLocation,
      [string]$deployment.deploymentName,
      [string]$deployment.modelName,
      [string]$deployment.modelVersion,
      [string]$deployment.sku,
      [string]$deployment.capacity,
      [string]$deployment.state,
      [string]$deployment.raiPolicy
    ) -join "\`t"
    Add-Content -LiteralPath (Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'models.tsv') -Value $modelRow -Encoding UTF8
  }
  $displayKey = if ([string]::IsNullOrWhiteSpace($key1)) { '-' } else { [string]$key1 }
  (@($AccountLocation, "https://$AccountName.services.ai.azure.com/api/projects/$ProjectName", "https://$AccountName.openai.azure.com", "https://$AccountName.services.ai.azure.com", $displayKey) -join "\`t") | Add-Content -LiteralPath (Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'regions.tsv') -Encoding UTF8
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
  if ($names.Count -eq 0) { [void]$names.Add('-') }
  foreach ($name in $names) {
    (@($AccountLocation, $name) -join "\`t") | Add-Content -LiteralPath (Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'available-models.tsv') -Encoding UTF8
  }
  $lines = New-Object System.Collections.Generic.List[string]
  [void]$lines.Add('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN')
  [void]$lines.Add($payload)
  [void]$lines.Add('AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END')
  $lines | Add-Content -LiteralPath (Join-Path $env:AZURE_FOUNDRY_TABLE_DIR 'payloads.txt') -Encoding UTF8
  Write-DeploymentReport
}`;

export const POWERSHELL_REPORT_INITIALIZATION = `function Initialize-DeploymentReport {
  if (-not $env:AZURE_FOUNDRY_TABLE_DIR) {
    $env:AZURE_FOUNDRY_TABLE_DIR = Join-Path ([System.IO.Path]::GetTempPath()) ('ai-foundry-manager-tables-' + [System.Guid]::NewGuid().ToString('N'))
  }
  New-Item -ItemType Directory -Force -Path $env:AZURE_FOUNDRY_TABLE_DIR | Out-Null

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
