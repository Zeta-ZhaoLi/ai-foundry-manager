import { powershellSingleQuote } from './escaping';
import { deriveIdentity, formatAccountIdentityComment } from './identity';
import {
  POWERSHELL_REPORT_FUNCTIONS,
  POWERSHELL_REPORT_INITIALIZATION,
} from './report';
import {
  AZURE_CLI_POWERSHELL_DEPLOYMENT_COMMAND,
  type AzureCliDeploymentIdentity,
  type AzureCliDeploymentInput,
  type AzureCliDeploymentModel,
  type AzureCliMultiRegionDeploymentInput,
  type AzureCliServicePrincipal,
} from './types';
import { validateAzureCliDeploymentInput } from './validation';

function stringifyPowerShellModelRows(
  models: AzureCliDeploymentModel[]
): string {
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
  overwriteExisting = false,
  accountId?: string,
  includeIdentityComment = true
): string {
  const overwriteDefault = overwriteExisting ? 'true' : 'false';
  const identityComment = formatAccountIdentityComment(accountId, accountEmail);
  return `${includeIdentityComment ? `${identityComment}\n` : ''}# Deployment method: save as deploy-foundry.ps1, then run:
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
$script:LastDeploymentReason = ''
$script:LastDeploymentSku = ''
$script:LastDeploymentCapacity = ''
$script:InteractiveProgress = -not [Console]::IsOutputRedirected

function Write-Section {
  param([string]$Title)
  Write-Host ''
  Write-Host '============================================================'
  Write-Host $Title
  Write-Host '============================================================'
}

function Write-Status {
  param([string]$Status, [string]$Message)
  Write-Host ('  [{0,-7}] {1}' -f $Status, $Message)
}

function Start-ModelProgress {
  param([string]$Message)
  if ($script:InteractiveProgress) {
    Write-Host -NoNewline ("\`r{0,-160}" -f ($Message + ' | RUNNING'))
  } else {
    Write-Host ($Message + ' | RUNNING')
  }
}

function Complete-ModelProgress {
  param([string]$Message)
  if ($script:InteractiveProgress) {
    Write-Host ("\`r{0,-160}" -f $Message)
  } else {
    Write-Host $Message
  }
}

function Write-DeploymentSummary {
  $label = 'Deployment summary'
  if ($env:AZURE_FOUNDRY_DEFER_REPORT_NOTICE -eq 'true') {
    $label = "Region summary ($AccountLocation)"
  }
  Write-Host ''
  Write-Host ('{0}: succeeded={1}, skipped={2}, failed={3}' -f $label, $SucceededDeployments.Count, $SkippedDeployments.Count, $FailedDeployments.Count)
  if ($SkippedDeployments.Count -gt 0) {
    Write-Host ('Skipped models: ' + [string]::Join(', ', $SkippedDeployments))
  }
  if ($FailedDeployments.Count -gt 0) {
    Write-Host ('Failed models: ' + [string]::Join(', ', $FailedDeployments))
  }
  if ($env:AZURE_FOUNDRY_DEFER_REPORT_NOTICE -ne 'true') {
    Write-Host "Result file: $script:ReportPath"
  }
}

function Add-RegionTotals {
  $env:AZURE_FOUNDRY_TOTAL_SUCCEEDED = ([int]$env:AZURE_FOUNDRY_TOTAL_SUCCEEDED + $SucceededDeployments.Count).ToString()
  $env:AZURE_FOUNDRY_TOTAL_SKIPPED = ([int]$env:AZURE_FOUNDRY_TOTAL_SKIPPED + $SkippedDeployments.Count).ToString()
  $env:AZURE_FOUNDRY_TOTAL_FAILED = ([int]$env:AZURE_FOUNDRY_TOTAL_FAILED + $FailedDeployments.Count).ToString()
}

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

  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI is required, and winget was not found. Install Azure CLI from https://learn.microsoft.com/cli/azure/install-azure-cli-windows, then rerun this script.'
  }

  $wingetOutput = & winget install -e --id Microsoft.AzureCLI --accept-package-agreements --accept-source-agreements 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw 'Azure CLI installation with winget failed. Install Azure CLI manually, then rerun this script.'
  }

  Refresh-AzureCliPath
  if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI installed, but az is still not on PATH. Open a new PowerShell window and rerun this script.'
  }
}

Write-Section -Title 'Prerequisites'
Write-Status -Status 'RUNNING' -Message 'Checking Azure CLI'
Ensure-AzureCli
Write-Status -Status 'OK' -Message 'Azure CLI is available'

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
  Write-Section -Title 'Authentication'
  if ($SpAppId -or $SpPassword -or $SpTenant) {
    if (-not $SpAppId -or -not $SpPassword -or -not $SpTenant) {
      throw 'Service Principal requires appId, password, and tenant.'
    }

    Write-Status -Status 'RUNNING' -Message 'Signing in with Service Principal'
    & az login --service-principal --username $SpAppId --password $SpPassword --tenant $SpTenant -o none
    if ($LASTEXITCODE -ne 0) {
      throw 'Service Principal login failed.'
    }
    Write-Status -Status 'OK' -Message 'Service Principal login succeeded'
  } else {
    Write-Status -Status 'INFO' -Message 'Using the current Azure CLI login'
  }

  if ($ConfiguredSubscriptionId) {
    $script:SubscriptionId = $ConfiguredSubscriptionId
  } elseif ($env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID -eq 'true' -and $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID) {
    $script:SubscriptionId = $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID
  } else {
    $allSubscriptions = Invoke-AzCliJson -Arguments @('account','list','--query',"[].{id:id,name:name,state:state,tenantId:tenantId,isDefault:isDefault}",'-o','json')
    if (-not $allSubscriptions) {
      $allSubscriptions = @()
    }
    if ($allSubscriptions -isnot [array]) {
      $allSubscriptions = @($allSubscriptions)
    }
    $subscriptions = @($allSubscriptions | Where-Object { $_.state -eq 'Enabled' })

    if ($subscriptions.Count -eq 0) {
      if (@($allSubscriptions | Where-Object { $_.state -eq 'Disabled' }).Count -gt 0) {
        Write-Host 'ERROR: Visible subscriptions exist but none are Enabled. Disabled subscriptions cannot deploy resources.'
      }
      throw 'No enabled subscriptions are visible to this identity.'
    } elseif ($subscriptions.Count -eq 1) {
      $script:SubscriptionId = $subscriptions[0].id
    } else {
      Write-Host 'Multiple enabled subscriptions found:'
      for ($i = 0; $i -lt $subscriptions.Count; $i++) {
        $n = $i + 1
        Write-Host "$n) $($subscriptions[$i].name) [$($subscriptions[$i].id)]"
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

  & az account set --subscription $script:SubscriptionId
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to set subscription.'
  }
  Write-Status -Status 'OK' -Message "Selected subscription: $script:SubscriptionId"
  if ($env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID -eq 'true') {
    $env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID = $script:SubscriptionId
  }
}

function Ensure-ProviderRegistered {
  $providerState = (& az provider show --namespace Microsoft.CognitiveServices --query registrationState -o tsv 2>$null)
  if (-not $providerState) { $providerState = 'NotRegistered' }
  if ($providerState -eq 'Registered') {
    Write-Status -Status 'OK' -Message 'Microsoft.CognitiveServices is registered'
    return
  }
  if ($AutoRegisterProvider -ne 'true') {
    Write-Warning 'Provider is not registered and AUTO_REGISTER_PROVIDER is not true.'
    return
  }
  Write-Status -Status 'RUNNING' -Message 'Registering Microsoft.CognitiveServices'
  & az provider register --namespace Microsoft.CognitiveServices -o none
  if ($LASTEXITCODE -ne 0) {
    Write-Warning 'Failed to start provider registration.'
    return
  }
  for ($attempt = 1; $attempt -le 60; $attempt++) {
    $providerState = (& az provider show --namespace Microsoft.CognitiveServices --query registrationState -o tsv 2>$null)
    if ($providerState -eq 'Registered') {
      Write-Status -Status 'OK' -Message 'Microsoft.CognitiveServices registration completed'
      return
    }
    Start-Sleep -Seconds 10
  }
  Write-Warning 'Provider registration did not reach Registered in time.'
}

function Ensure-ResourceGroup {
  & az group show --name $ResourceGroup -o none 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Status -Status 'EXISTS' -Message "Resource group: $ResourceGroup"
    return
  }
  Write-Status -Status 'RUNNING' -Message "Creating resource group: $ResourceGroup"
  & az group create --name $ResourceGroup --location $ResourceGroupLocation -o none
  if ($LASTEXITCODE -ne 0) {
    Write-Status -Status 'FAILED' -Message "Resource group: $ResourceGroup"
    return
  }
  Write-Status -Status 'CREATED' -Message "Resource group: $ResourceGroup"
}

function Ensure-FoundryAccount {
  $account = Invoke-AzCliJson -Arguments @('cognitiveservices','account','show','--name',$AccountName,'--resource-group',$ResourceGroup,'-o','json') -QuietOnError
  if ($account) {
    Write-Status -Status 'EXISTS' -Message "Foundry account: $AccountName"
  } else {
    Write-Status -Status 'RUNNING' -Message "Creating Foundry account: $AccountName"
    & az cognitiveservices account create --name $AccountName --resource-group $ResourceGroup --kind AIServices --sku s0 --location $AccountLocation --allow-project-management -o none
    if ($LASTEXITCODE -ne 0) {
      Write-Status -Status 'FAILED' -Message "Foundry account: $AccountName"
    } else {
      Write-Status -Status 'CREATED' -Message "Foundry account: $AccountName"
    }
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
    Write-Status -Status 'OK' -Message "Custom domain: $existingCustomDomain"
    return $true
  }

  $output = Invoke-AzureCli -Arguments @('cognitiveservices','account','update','--name',$AccountName,'--resource-group',$ResourceGroup,'--custom-domain',$AccountName,'-o','none')
  if ($LASTEXITCODE -eq 0) {
    Write-Status -Status 'CREATED' -Message "Custom domain: $AccountName"
    return $true
  }

  Write-Warning "Could not set custom domain for '$AccountName'."
  if ($output) { $output | ForEach-Object { Write-Warning $_ } }
  return $false
}

function Ensure-FoundryProject {
  & az cognitiveservices account project show --name $AccountName --resource-group $ResourceGroup --project-name $ProjectName -o none 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Status -Status 'EXISTS' -Message "Foundry project: $ProjectName"
    return
  }
  Write-Status -Status 'RUNNING' -Message "Creating Foundry project: $ProjectName"
  $output = Invoke-AzureCli -Arguments @('cognitiveservices','account','project','create','--name',$AccountName,'--resource-group',$ResourceGroup,'--project-name',$ProjectName,'--location',$AccountLocation,'-o','none')
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Could not create Foundry project '$ProjectName'."
    if ($output) { $output | ForEach-Object { Write-Warning $_ } }
  } else {
    Write-Status -Status 'CREATED' -Message "Foundry project: $ProjectName"
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

  return [pscustomobject]@{
    SkuName = $SkuName
    Capacity = [int]$capacity
  }
}

function Print-CapacityDebug {
  param([string]$ModelFormat, [string]$ModelName, [string]$ModelVersion)
}

function Wait-UntilSucceeded {
  param([string]$DeploymentName, [int]$MaxAttempts = 120, [int]$SleepSeconds = 10)
  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    $state = Get-DeploymentState -DeploymentName $DeploymentName
    if ($state -eq 'Succeeded') { return $true }
    if ($state -in @('Failed','Canceled','Cancelled')) {
      $script:LastDeploymentReason = "deployment state: $state"
      Write-Warning "Deployment '$DeploymentName' ended with state: $state"
      return $false
    }
    Start-Sleep -Seconds $SleepSeconds
  }
  $script:LastDeploymentReason = 'deployment timed out'
  Write-Warning "Timed out waiting for '$DeploymentName' to reach Succeeded."
  return $false
}

function Deploy-ModelWithMaxCapacity {
  param([string]$DeploymentName, [string]$ModelFormat, [string]$ModelName, [string]$ModelVersion, [int]$ConfiguredMaxCapacity = 0)
  $script:LastDeploymentReason = ''
  $script:LastDeploymentSku = ''
  $script:LastDeploymentCapacity = ''
  $deploymentAlreadyExists = Deployment-Exists -DeploymentName $DeploymentName
  if ($deploymentAlreadyExists) {
    if ($OverwriteExisting -ne 'true') {
      $script:LastDeploymentReason = 'already exists, overwrite disabled'
      return 2
    }
  }

  $selectedSkuCapacity = $null
  $forceConfiguredCapacity = $false
  if ($deploymentAlreadyExists) {
    $existingDeployment = Get-ExistingDeploymentIfSameModel -DeploymentName $DeploymentName -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
    if ($null -ne $existingDeployment -and $existingDeployment.SkuName) {
      if ($existingDeployment.SkuName -eq $SkuName) {
        $availableForExistingSku = Get-AvailableCapacity -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion -SkuName $SkuName
        if ($null -eq $availableForExistingSku) { $availableForExistingSku = 0 }
        $selectedSkuCapacity = [pscustomobject]@{
          SkuName = $SkuName
          Capacity = [int]$availableForExistingSku
          ExistingCapacity = [int]$existingDeployment.Capacity
        }
      } else {
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
      $script:LastDeploymentReason = "no $SkuName capacity record"
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
    $targetCapacity = $ConfiguredMaxCapacity
  }
  if ($targetCapacity -le 0) {
    $script:LastDeploymentReason = 'no available capacity'
    Print-CapacityDebug -ModelFormat $ModelFormat -ModelName $ModelName -ModelVersion $ModelVersion
    return 2
  }

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
    $deploymentOutput = Invoke-AzureCli -Arguments @('rest','--method','put','--url',$deploymentUrl,'--headers','Content-Type=application/json','--body',('@' + $deploymentPayloadPath),'-o','none')
    if ($LASTEXITCODE -ne 0) {
      $script:LastDeploymentReason = 'deployment request failed'
      if ($deploymentOutput) { $deploymentOutput | ForEach-Object { Write-Warning $_ } }
      return 1
    }
  } finally {
    Remove-Item -LiteralPath $deploymentPayloadPath -Force -ErrorAction SilentlyContinue
  }
  if (-not (Wait-UntilSucceeded -DeploymentName $DeploymentName)) {
    if (-not $script:LastDeploymentReason) { $script:LastDeploymentReason = 'deployment did not succeed' }
    return 1
  }
  $script:LastDeploymentSku = $selectedSkuName
  $script:LastDeploymentCapacity = $targetCapacity
  return 0
}

${POWERSHELL_REPORT_FUNCTIONS}

function Prepare-AccountResources {
  Write-Section -Title "Resources - $AccountLocation"
  Write-Host "Account: $AccountName"
  Write-Host "Resource group: $ResourceGroup"
  Write-Host "Region: $AccountLocation"
  Ensure-ResourceGroup
  $accountReadyForProject = Ensure-FoundryAccount
  if ($accountReadyForProject) {
    Ensure-FoundryProject
  }
}

function Deploy-AllModels {
  Write-Section -Title "Models - $AccountLocation"
  $modelTotal = $Models.Count
  $modelIndex = 0
  Write-Host "Models selected: $modelTotal"
  foreach ($item in $Models) {
    $modelIndex++
    $parts = $item -split '\\|', 5
    if ($parts.Count -lt 4) { continue }
    $configuredMaxCapacity = 0
    if ($parts.Count -ge 5) {
      [void][int]::TryParse($parts[4], [ref]$configuredMaxCapacity)
    }
    $progressPrefix = '[{0:D2}/{1:D2}] {2}' -f $modelIndex, $modelTotal, $parts[0]
    Start-ModelProgress -Message $progressPrefix
    $rc = Deploy-ModelWithMaxCapacity -DeploymentName $parts[0] -ModelFormat $parts[1] -ModelName $parts[2] -ModelVersion $parts[3] -ConfiguredMaxCapacity $configuredMaxCapacity
    if ($rc -eq 0) {
      $SucceededDeployments += $parts[0]
      Complete-ModelProgress -Message ("$progressPrefix | SUCCESS | SKU=$script:LastDeploymentSku | capacity=$script:LastDeploymentCapacity")
    } elseif ($rc -eq 2) {
      $SkippedDeployments += $parts[0]
      $reason = if ($script:LastDeploymentReason) { $script:LastDeploymentReason } else { 'not deployable' }
      Complete-ModelProgress -Message ("$progressPrefix | SKIPPED | $reason")
    } else {
      Write-Warning "Deployment '$($parts[0])' failed; continuing with the next deployment."
      $FailedDeployments += $parts[0]
      $reason = if ($script:LastDeploymentReason) { $script:LastDeploymentReason } else { 'unknown error' }
      Complete-ModelProgress -Message ("$progressPrefix | FAILED | $reason")
    }
  }
}

Login-AndSelectSubscription

${POWERSHELL_REPORT_INITIALIZATION}

Write-Section -Title 'Provider'
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
  Append-DeploymentReport
  Write-DeploymentSummary
  if ($env:AZURE_FOUNDRY_DEFER_REPORT_NOTICE -eq 'true') {
    Add-RegionTotals
  }
}
${includeIdentityComment ? `\n${identityComment}` : ''}
`.trimEnd();
}

function buildAzureCliPowerShellDeploymentScriptInternal(
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

  return buildAzureCliPowerShellDeploymentScriptBody(
    identity,
    stringifyPowerShellModelRows(input.models),
    input.servicePrincipal,
    input.accountEmail,
    input.overwriteExisting,
    input.accountId,
    includeIdentityComment
  );
}

export function buildAzureCliPowerShellDeploymentScript(
  input: AzureCliDeploymentInput
): string {
  return buildAzureCliPowerShellDeploymentScriptInternal(input, true);
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

  const identityComment = formatAccountIdentityComment(
    input.accountId,
    input.accountEmail
  );
  return [
    identityComment,
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_PATH -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_TIMESTAMP -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID -ErrorAction SilentlyContinue',
    "$env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID = 'true'",
    "$env:AZURE_FOUNDRY_DEFER_REPORT_NOTICE = 'true'",
    "$env:AZURE_FOUNDRY_TOTAL_SUCCEEDED = '0'",
    "$env:AZURE_FOUNDRY_TOTAL_SKIPPED = '0'",
    "$env:AZURE_FOUNDRY_TOTAL_FAILED = '0'",
    "Write-Host ''",
    "Write-Host '============================================================'",
    "Write-Host 'Azure AI Foundry multi-region deployment'",
    "Write-Host '============================================================'",
    `Write-Host 'Account: ${powershellSingleQuote(input.accountId?.trim() || '-')} | Email: ${powershellSingleQuote(input.accountEmail || '')}'`,
    `Write-Host 'Regions: ${targets.length}'`,
    '# ============================================================',
    '# Prepare all selected regions first',
    '# ============================================================',
    ...targets.map((target, index) => {
      const label = target.label?.trim() || `Region ${index + 1}`;
      const script = buildAzureCliPowerShellDeploymentScriptInternal(
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
      const script = buildAzureCliPowerShellDeploymentScriptInternal(
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
        `# Deploy ${label.replace(/\r?\n/g, ' ')}`,
        `# ============================================================`,
        `$env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE = 'deploy-only'`,
        script,
      ].join('\n');
    }),
    "Write-Host ''",
    "Write-Host '============================================================'",
    "Write-Host 'Summary'",
    "Write-Host '============================================================'",
    'Write-Host "Deployment summary: succeeded=$env:AZURE_FOUNDRY_TOTAL_SUCCEEDED, skipped=$env:AZURE_FOUNDRY_TOTAL_SKIPPED, failed=$env:AZURE_FOUNDRY_TOTAL_FAILED"',
    'Write-Host "Result file: $env:AZURE_FOUNDRY_REPORT_PATH"',
    'Remove-Item Env:AZURE_FOUNDRY_DEPLOYMENT_RUN_MODE -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_DEFER_REPORT_NOTICE -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_TOTAL_SUCCEEDED -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_TOTAL_SKIPPED -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_TOTAL_FAILED -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_PATH -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REPORT_TIMESTAMP -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_SELECTED_SUBSCRIPTION_ID -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_FOUNDRY_REUSE_SELECTED_SUBSCRIPTION_ID -ErrorAction SilentlyContinue',
    'Remove-Item Env:AZURE_CONFIG_DIR -ErrorAction SilentlyContinue',
    identityComment,
  ].join('\n\n');
}
