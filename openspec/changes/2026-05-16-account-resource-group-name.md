# Account Resource Group Name

## Summary
Add an account-level resource group name field used by Azure CLI and PowerShell deployment exports.

## Motivation
Deployment exports currently infer a shared resource group from the first region that has an AOAI resource name. This makes the resource group change implicitly when regions are disabled, reordered, or edited. Users need a stable account-level value that can be generated once and then edited manually.

## Files Affected
- `src/hooks/useLocalAzureAccounts.ts` - Persist `resourceGroupName` and expose an update handler.
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` - Add the editable field, generate action, and use the saved value for account-level exports.
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` - Require the account resource group for single-region exports.
- `src/i18n/locales/*.json` - Add resource group labels and validation messages.
- Tests under `src/hooks/__tests__/` and `src/components/Dashboard/AccountConfiguration/__tests__/` - Cover persistence, generation, and export behavior.

## Implementation Plan
1. Add optional `resourceGroupName` to `LocalAccount` and update localStorage persistence through the existing account save path.
2. Add `updateAccountResourceGroupName` and thread it through dashboard/account components.
3. Render an account-level resource group input with a generate button that derives `rg-${projectId}` from the first region resource identity using the existing CLI identity helper.
4. Use the saved account resource group for both single-region and multi-region Azure CLI exports.
5. Keep legacy configs unchanged until the user fills or generates the new field.

## Testing
- Run focused hook and deployment configuration tests.
- Verify existing Azure CLI deployment generator tests still pass.

## Risks/Considerations
Exports now require the account-level resource group field. Existing accounts need the user to generate or enter it once before exporting deployment scripts.
