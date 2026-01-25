# Integrate Model Deployment Into Account/Region UI

## Summary

Integrate the model-deployment feature directly into each account/region card: users fill Azure deployment-related info in account settings, configure per-model deployment metadata (deploymentName/version/capacity) in region settings, then click a single button to deploy (or generate the deployable artifact) for the selected models.

This supersedes the standalone "Model Deployment" dashboard section from `openspec/changes/0001-model-deployment.md`.

## Motivation

The current global deployment builder is disconnected from the real workflow: deployment settings are naturally per account and per region, and deployments should align with the region’s selected models (`modelsText`). Embedding deployment controls where models are selected reduces rework and prevents mistakes.

## UX Changes

- AccountCard: add a "部署配置" block to store subscription-level settings.
- RegionCard: add a "模型部署" block showing selected models and per-model deployment fields; provide a single action button to deploy selected models.

## Data Model Changes

Extend local config types:

- `LocalAccount.deployment` (new)
  - `subscriptionId` (required for real deployment)
  - `resourceGroup` (required for real deployment)
  - optional defaults (e.g. `deploymentNamePrefix`)
- `LocalRegion.deployment` (new)
  - `resourceName` (Azure OpenAI account name; can be auto-derived from endpoint)
  - `location` (defaults to `region.name`)
  - `models` map keyed by modelName: `{ deploymentName, version, capacity }`

## Implementation Plan

1. Update types and persistence
   - Update `src/hooks/useLocalAzureAccounts.ts` interfaces and migration defaults.
   - Add hook updaters:
     - `updateAccountDeployment(accountId, patch)`
     - `updateRegionDeployment(accountId, regionId, patch)`
     - `updateRegionDeploymentModel(accountId, regionId, modelName, patch)`
2. Region UI integration
   - Update `src/components/Dashboard/AccountConfiguration/RegionCard.tsx`:
     - New "模型部署" section
     - Auto-suggest `resourceName` from `openaiEndpoint` using `extractAzureResourceName`
     - Render a table of currently selected models with editable `deploymentName/version/capacity`
     - Provide a primary action: "一键部署选中模型"
3. Account UI integration
   - Update `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`:
     - New "部署配置" block for `subscriptionId` and `resourceGroup`
4. One-click Azure Portal deployment (chosen)
   - "One click" = export ARM template (copy + download) and open Azure Portal for the target resource group.
   - The user completes deployment inside Portal via "Custom deployment" (no app registration / Client ID required).
   - Add a confirmation dialog warning about cost and that the action will open Portal.
5. Remove/simplify the standalone deployment section
   - Remove `src/components/Dashboard/ModelDeployment/*` and the section usage in `src/components/AzureModelsDashboard.tsx`.
6. Tests
   - Keep `src/utils/armTemplate.ts` tests; add tests for mapping selected models -> ARM template input.

## Files Affected

- `src/hooks/useLocalAzureAccounts.ts` - Add deployment fields + updaters
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` - Add account deployment settings UI
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` - Add per-region deployment UI and "deploy" action
- `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx` - Thread new callbacks
- `src/components/AzureModelsDashboard.tsx` - Remove the standalone deployment section
- `src/utils/armTemplate.ts` - Reused
- `src/utils/azurePortal.ts` - Azure Portal deep-link helpers
- `src/utils/__tests__/armTemplate.test.ts` - Reused/extended
- `src/i18n/locales/zh.json` + `src/i18n/locales/en.json` - Add strings for integrated UI

## Testing

- `npm run test -- --run`
- `npm run build`
- Manual:
  - Pick a region, select models, fill version/capacity, export template
  - Validate exported template matches expected structure

## Risks/Considerations

- This flow still results in real resource creation/updates in Azure (done in Portal) and can incur cost.
- Portal deep links cannot reliably prefill a large inline template; we export the template (copy/download) and open Portal.
- Per-model `version` is not discoverable without Azure APIs; we can only store user input and validate structure.
