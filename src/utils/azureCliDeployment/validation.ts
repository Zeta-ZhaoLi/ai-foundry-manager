import { deriveIdentity } from './identity';
import type {
  AzureCliDeploymentInput,
  AzureCliDeploymentValidation,
} from './types';

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
