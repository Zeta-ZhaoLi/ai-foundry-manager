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
  accountId?: string;
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
  accountId?: string;
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
