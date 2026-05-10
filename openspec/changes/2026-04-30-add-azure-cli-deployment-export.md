# Add Azure CLI Deployment Export

## Summary
Add Azure CLI deployment export actions to each region's model deployment section. The generated script uses Azure Management REST APIs through `az rest` to query model capacity and deploy each selected model at the maximum available `GlobalStandard` capacity.

The script also prints a copyable comma-separated import list after the final deployment table. The list includes both each succeeded deployment's model name and deployment name, matching the model-list import format.

Region-level Azure CLI export now copies a script for every model in the master model directory, because the runtime script can skip unavailable models automatically. Account-level region headers also provide a single Azure CLI export that deploys all regions for that account, using the first region's inferred resource group for every later region.

## Motivation
The current ARM template export requires static capacity values. Azure CLI can query `modelCapacities` at execution time, allowing deployments to use the actual maximum available quota per model and region.

## Files Affected
- `src/hooks/useLocalAzureAccounts.ts` - Add account-level subscription ID persistence and updater.
- `src/components/Dashboard/AccountConfiguration/*` - Thread subscription ID into account and region UI, and add CLI buttons.
- `src/utils/azureCliDeployment.ts` - Generate and validate single-region and multi-region Azure CLI deployment scripts.
- `Azure-CLI-AI-Founryd-Deployment-Template.sh` - Keep the reference CLI script aligned with generated output.
- `src/i18n/locales/*.json` - Add labels and validation messages.
- `src/utils/__tests__/azureCliDeployment.test.ts` - Cover identity derivation, script generation, and validation.

## Implementation Plan
1. Store `subscriptionId` on each account and expose `updateAccountSubscriptionId`.
2. Add a Subscription ID input to account cards.
3. Generate region CLI scripts from the full master model directory so unavailable models can be skipped by the script at runtime.
4. Generate account-level multi-region CLI scripts using the first region's inferred resource group for all regions.
5. Copy a fixed three-line command for running the generated script.
6. Print the final Azure deployment table and a copyable import list with succeeded model/deployment names.
7. Keep existing ARM JSON export, relabeled as ARM deployment code.

## Testing
- Run TypeScript checks.
- Run lint and unit tests where local dependencies allow.
- Add targeted unit tests for the CLI generator.

## Risks/Considerations
- The generated script requires `az` and `jq`.
- Resource group is inferred as `rg-${projectId}` from Foundry Project Endpoint or resource name fallback.
- ARM export remains static-capacity by design.
