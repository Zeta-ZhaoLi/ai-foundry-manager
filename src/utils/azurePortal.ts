export function buildAzurePortalResourceGroupOverviewUrl(args: {
  subscriptionId: string;
  resourceGroup: string;
}): string {
  const sub = args.subscriptionId.trim();
  const rg = encodeURIComponent(args.resourceGroup.trim());
  return `https://portal.azure.com/#resource/subscriptions/${sub}/resourceGroups/${rg}/overview`;
}

export function buildAzurePortalCustomDeploymentUrl(): string {
  // Azure Portal -> "Custom deployment" entry
  return 'https://portal.azure.com/#create/Microsoft.Template';
}
