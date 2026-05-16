# Allow Subscription Discovery

## Summary
Allow Azure CLI and PowerShell deployment exports when Subscription ID is empty. Generated scripts discover enabled subscriptions at runtime through Azure CLI.

## Motivation
Users often run deployment scripts in an Azure CLI context that can discover available subscriptions. The app should not block copying deployment code solely because the local Subscription ID field is empty.

## Files Affected
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` - Remove account-level export precheck for Subscription ID or Service Principal.
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` - Remove region-level export precheck for Subscription ID or Service Principal.
- `src/utils/azureCliDeployment.ts` - Allow empty Subscription ID and no Service Principal in single-region and multi-region script generation.
- Tests under `src/utils/__tests__/` and `src/components/Dashboard/AccountConfiguration/__tests__/` - Cover runtime subscription discovery script generation.

## Implementation Plan
1. Keep resource group, resource name, location, and model validation unchanged.
2. Remove frontend auth prechecks before copying deployment scripts.
3. Remove generator validation that requires either Subscription ID or complete Service Principal.
4. Preserve existing script runtime behavior: Service Principal login when configured, otherwise `az account list` discovery when no configured subscription is provided.

## Testing
- Focused Azure CLI deployment generator tests.
- Focused account/region deployment configuration tests.
- TypeScript compile check.

## Risks/Considerations
If the script runtime has no Azure CLI login and no Service Principal, subscription discovery fails at runtime instead of copy time. Scripts do not run interactive `az login` automatically.
