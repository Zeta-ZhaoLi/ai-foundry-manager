# Add Azure CLI Deployment Export

## Summary
Add Azure CLI deployment export actions to each region's model deployment section. The generated script uses Azure Management REST APIs through `az rest` to query model capacity and deploy each selected model at the maximum available `GlobalStandard` capacity.

## Motivation
The current ARM template export requires static capacity values. Azure CLI can query `modelCapacities` at execution time, allowing deployments to use the actual maximum available quota per model and region.

## Files Affected
- `src/hooks/useLocalAzureAccounts.ts` - Add account-level subscription ID persistence and updater.
- `src/components/Dashboard/AccountConfiguration/*` - Thread subscription ID into account and region UI, and add CLI buttons.
- `src/utils/azureCliDeployment.ts` - Generate and validate Azure CLI deployment scripts.
- `src/i18n/locales/*.json` - Add labels and validation messages.
- `src/utils/__tests__/azureCliDeployment.test.ts` - Cover identity derivation, script generation, and validation.

## Implementation Plan
1. Store `subscriptionId` on each account and expose `updateAccountSubscriptionId`.
2. Add a Subscription ID input to account cards.
3. Generate CLI scripts from the selected deployment rows in each region.
4. Copy a fixed three-line command for running the generated script.
5. Keep existing ARM JSON export, relabeled as ARM deployment code.

## Testing
- Run TypeScript checks.
- Run lint and unit tests where local dependencies allow.
- Add targeted unit tests for the CLI generator.

## Risks/Considerations
- The generated script requires `az` and `jq`.
- Resource group is inferred as `rg-${projectId}` from Foundry Project Endpoint or resource name fallback.
- ARM export remains static-capacity by design.
