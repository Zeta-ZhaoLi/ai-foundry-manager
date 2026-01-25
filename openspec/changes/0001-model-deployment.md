# Azure OpenAI Model Deployment (ARM Template Builder)

## Summary

Add a model-deployment feature to the existing dashboard UI that builds and exports an Azure Resource Manager (ARM) template for Azure OpenAI model deployments, based on the structure in `模型部署代码示例.txt`.

## Motivation

Today the app helps curate model lists for accounts/regions, but actually deploying those models in Azure OpenAI is still a manual step. A template builder makes deployments repeatable, reviewable, and easy to execute via Azure Portal or `az` CLI without introducing backend credentials into this pure-frontend project.

## UI/UX Notes (Fit Current UI)

- Add a new dashboard section (same visual style as existing sections) called "模型部署 / Model Deployment".
- Primary interaction uses a `Dialog` (size `full`/`xl`) so the builder can be dense without cluttering the main dashboard.
- The builder can optionally pull model names from existing account/region configuration (so you don't retype model lists), but still requires you to fill `version` and `capacity`.

## Files Affected

- `src/components/Dashboard/` (new) `ModelDeployment/ModelDeploymentSection.tsx` - Dashboard section + dialog entry point
- `src/components/Dashboard/` (new) `ModelDeployment/ModelDeploymentBuilder.tsx` - Builder UI (resource name, location, deployment list, JSON output)
- `src/utils/` (new) `armTemplate.ts` - Pure functions to generate/validate ARM template JSON
- `src/components/AzureModelsDashboard.tsx` - Add the new "Model Deployment" section
- `src/components/CommandPalette.tsx` (optional) - Add command to open the template builder
- `src/i18n/locales/zh.json` - New UI strings (Chinese)
- `src/i18n/locales/en.json` - New UI strings (English)
- `src/schemas/` (optional) `armTemplate.ts` - Zod schemas for validating the builder form state
- `src/__tests__/utils/armTemplate.test.ts` - Unit tests for template generation and validation

## Implementation Plan

1. Implement an ARM template generator in `src/utils/armTemplate.ts`.
   - Inputs: `resourceName`, `location`, and a list of `modelDeployments` items `{ deploymentName, modelName, version, capacity }`.
   - Output: a JSON object matching the schema and resources structure from `模型部署代码示例.txt`.
   - Validation rules (client-side):
     - `resourceName` required; `location` required
     - `deploymentName` unique (the sample includes duplicates; we should prevent/auto-dedupe)
     - `capacity` is a positive integer
     - `modelName`/`version` required
2. Build the UI in `src/components/Dashboard/ModelDeployment/ModelDeploymentBuilder.tsx`.
   - Top controls:
     - `resourceName` (Cognitive Services account name)
     - `location` (Azure region, e.g. `eastus2`)
     - Optional "从现有配置导入" (Import from existing config): choose `Account` + `Region`, then prefill deployment rows from that region's `modelsText`.
       - Defaults when importing: `deploymentName = modelName`, `version = ''` (must fill), `capacity = 1000`.
   - Editable list (add/remove/reorder) of deployments.
   - Buttons:
     - `Copy JSON` (clipboard)
     - `Download .json` (filename includes resource name and date)
     - `Reset to sample` (seed form with the example set from `模型部署代码示例.txt`)
   - Optional helper panel: show example CLI commands (string only), e.g. `az deployment group create ... --template-file`.
3. Wire the feature into the app UI.
   - Add `ModelDeploymentSection` to `src/components/AzureModelsDashboard.tsx` (recommended placement: after `AccountsSection`, before `GlobalSummary`).
   - The section contains a short description + a button to open the builder dialog.
   - (Optional) add a command palette command to open the dialog.
4. Add i18n strings (zh/en) and keep copy consistent with existing tone.
5. Add unit tests for the generator.
   - Snapshot test of generated JSON structure
   - Validation tests (duplicate deployment names, missing fields)

## Testing

- `npm run test` (Vitest)
- Manual:
  - Generate JSON, validate it parses and looks correct
  - Copy/download works
  - Deploy template using Azure Portal "Custom deployment" or `az deployment group create` (out of app)

## Risks/Considerations

- ARM schema/API versions can change; we should keep `apiVersion` values centralized in the generator for easy updates.
- Model availability and version strings vary by region; the app cannot validate against Azure without credentials, so validation is structural only.
- This feature should remain offline/local-first: do not store Azure credentials; treat the output template as the deliverable.
