# Subscription Discovery Diagnostics

## Summary
Improve generated deployment scripts so subscription discovery failures include visible subscription state details.

## Motivation
When an identity only has disabled subscriptions, the current scripts report that no enabled subscriptions are visible without explaining that disabled subscriptions were found and cannot deploy resources.

## Files Affected
- `src/utils/azureCliDeployment.ts` - Query all visible subscriptions, filter enabled subscriptions locally, and print diagnostics when none are enabled.
- `src/utils/__tests__/azureCliDeployment.test.ts` - Cover the updated subscription discovery script content.

## Implementation Plan
1. Update Bash and PowerShell subscription discovery to call `az account list` without filtering by state.
2. Filter enabled subscriptions locally for the existing selection flow.
3. When no enabled subscriptions exist, print current Azure CLI account context and all visible subscriptions with state, tenant, and default status.
4. Print an explicit disabled-subscription message when any visible subscription has state `Disabled`.

## Testing
- Focused Azure CLI deployment generator tests.
- TypeScript compile check.

## Risks/Considerations
Diagnostics are based on Azure CLI `az account list` output only and do not call additional ARM APIs.
