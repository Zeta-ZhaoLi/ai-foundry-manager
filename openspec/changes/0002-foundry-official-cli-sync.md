# Azure Foundry Official CLI Sync

## Summary
Synchronize Azure CLI and ARM exports with the official Azure AI Foundry resource model. Generated deployment code creates a shared resource group per local account, creates one AIServices Foundry resource and Foundry project per enabled region, then deploys selected or all models.

## Motivation
The previous CLI deployment flow assumed existing Azure OpenAI resources and reused the first region resource group for every region. That conflicted with the app-generated Foundry project endpoint shape and with the official Foundry CLI workflow. The new flow should be repeatable, so existing resource groups, Foundry resources, and projects are skipped instead of causing duplicate-create failures.

## Files Affected
- `src/utils/azureCliDeployment.ts` - Generate idempotent official Foundry CLI scripts.
- `src/utils/armTemplate.ts` - Align ARM account resources to AIServices/Foundry semantics.
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` - Pass region locations into multi-region CLI exports.
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` - Pass region location into single-region CLI exports.
- `src/utils/__tests__/azureCliDeployment.test.ts` - Cover idempotent setup and official CLI commands.
- `src/utils/__tests__/armTemplate.test.ts` - Cover AIServices account output.
- `src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx` - Cover enabled-region filtering and shared resource group behavior.

## Implementation Plan
1. Derive CLI identity from subscription, resource name, region location, resource group, and optional Foundry project endpoint.
2. Generate Bash scripts that ensure provider registration, resource group, AIServices account, custom domain, and Foundry project before model deployment.
3. Keep max-capacity deployment by querying `modelCapacities`, then use `az cognitiveservices account deployment create` with computed `--sku-capacity`.
4. Update ARM account resources to `kind: AIServices` with project management enabled.
5. Update UI exporters to include only enabled deployable regions and pass location to the script builder.

## Testing
Run:

```bash
npm run test
npm run lint
npm run build
```

## Risks/Considerations
- The generated script targets Bash/Azure Cloud Shell and still requires `jq`.
- Existing non-Foundry Cognitive Services resources with the same name will be detected as existing accounts; users should avoid name collisions across resource types.
