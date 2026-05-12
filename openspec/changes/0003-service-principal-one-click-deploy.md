# Service Principal One-Click Deployment

## Summary
Add account-level Service Principal credentials and generate one-command Azure CLI deployment scripts for Bash and PowerShell. Scripts authenticate non-interactively, choose the target subscription, reuse existing Foundry resources, deploy selected or all models, and print the subscription plus per-region key output to the console.

## Motivation
Operators may run deployments repeatedly from a local machine without browser-based user login. The app should accept the Service Principal JSON created for each Azure account and produce scripts that can discover subscriptions when a subscription ID is not preconfigured.

## Files Affected
- `src/hooks/useLocalAzureAccounts.ts` - store Service Principal data and encrypt the secret.
- `src/utils/servicePrincipal.ts` - parse and validate imported Service Principal JSON.
- `src/utils/azureCliDeployment.ts` - support Service Principal auth, subscription selection, API key output, and PowerShell scripts.
- `src/components/Dashboard/AccountConfiguration/*.tsx` - add import UI and pass account auth into deployment script builders.
- `src/i18n/locales/*.json` - add UI copy for Service Principal controls.
- `src/**/__tests__/*` - cover parser, storage encryption, script generation, and UI flow.

## Implementation Plan
1. Add the `servicePrincipal` account field and encrypt/decrypt its password with the existing local encryption helper.
2. Add a parser for `{ appId, displayName, password, tenant }` with clear missing-field errors.
3. Extend Bash script generation to log in with Service Principal credentials, auto-select subscriptions when needed, and print per-region key summaries.
4. Add equivalent PowerShell script generation using the same target identity/model resolution.
5. Update account and region UI flows so script export is allowed when either subscription ID or a complete Service Principal is available.
6. Add tests for parser, encrypted persistence, Bash/PowerShell script content, and UI import/export behavior.

## Testing
- `vitest --run`
- `tsc --noEmit`
- `eslint src --ext .ts,.tsx`
- `vite build`

## Risks/Considerations
- Service Principal secrets are embedded in copied scripts because the requested workflow is one command from local PowerShell or Bash. They remain encrypted in browser storage and are not written by generated scripts.
- Subscription auto-selection prompts only when multiple enabled subscriptions are returned, avoiding accidental deployment into an arbitrary subscription.
- Service Principal RBAC must allow provider registration, resource creation, deployment creation, and key listing.
