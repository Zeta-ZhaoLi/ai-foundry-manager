import { getDefaultProjectIdFromResourceName } from '../common';
import type {
  AzureCliDeploymentIdentity,
  AzureCliDeploymentInput,
} from './types';

function sanitizeIdentityPart(value?: string): string {
  return (value || '').replace(/[\r\n]+/g, ' ').trim() || '-';
}

export function formatAccountIdentityComment(
  accountId?: string,
  accountEmail?: string
): string {
  return `# Account: ${sanitizeIdentityPart(accountId)} | Email: ${sanitizeIdentityPart(accountEmail)}`;
}

export function deriveIdentity(
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
      const hostMatch = url.hostname.match(
        /^([^.]+)\.services\.ai\.azure\.com$/
      );
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
