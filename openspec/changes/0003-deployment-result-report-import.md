# Deployment Result Report Import

## Summary
Generate a local txt report after Azure AI Foundry deployment and allow the Web UI to import that report to fill account subscription ID and region API keys.

## Motivation
The one-click deployment scripts can create resources and deploy models, but users still need to manually copy subscription IDs and API keys back into the dashboard. A deployment report gives them a durable local record and a reliable import path.

## Files Affected
- `src/utils/azureCliDeployment.ts` - Write deployment result txt reports from generated Bash and PowerShell scripts.
- `src/utils/deploymentResultImport.ts` - Parse report text and expose importable deployment result records.
- `src/hooks/useLocalAzureAccounts.ts` - Merge parsed report data into existing local accounts.
- `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx` - Add txt file/paste import UI.
- `src/components/AzureModelsDashboard.tsx` - Wire the deployment-result import handler into the account section.
- Tests under `src/**/__tests__` - Cover script generation, parsing, hook merge behavior, and UI import.

## Implementation Plan
1. Add a stable report format: human-readable txt plus a JSON block between `AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN` and `AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_END`.
2. Update Bash and PowerShell scripts to create `foundry-deployment-result-<subscriptionId>-<timestamp>.txt` in the script directory, append one region block per account resource, and keep console summaries unchanged.
3. Add parser support for one or many JSON blocks, with fallback parsing for the human-readable account summary.
4. Add a hook method that matches an existing account by subscription ID or region resource/endpoint, updates only subscription ID and API keys, and adds missing regions under the matched account.
5. Add an account toolbar button that accepts `.txt` file upload or pasted content and shows a toast import summary.

## Testing
- Verify generated scripts include report paths, JSON markers, account summary fields, deployment status fields, and multi-region shared report behavior.
- Verify parser accepts JSON blocks, merges multiple blocks, and rejects unrelated text.
- Verify hook import updates subscription ID/API keys, adds missing regions, preserves endpoints/resource names, and errors when no account matches.
- Verify UI supports both file import and paste import.
- Run `npm run test`, `npm run lint`, and `npm run build`.

## Risks/Considerations
- The txt report contains API keys by design. It must stay local and should not be committed or shared.
- Import scope is intentionally narrow: only subscription ID and API keys are persisted from the report.
- Fallback text parsing is best-effort; the marked JSON block is the supported stable import contract.
