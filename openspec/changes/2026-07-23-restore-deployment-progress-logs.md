# Restore Deployment Progress Logs

## Summary

Restore structured progress output in generated Bash and PowerShell deployment
scripts while keeping the deployment result file concise and importable.

## Motivation

The scripts currently suppress almost all normal progress and then print the
full endpoint, key, and model report to the terminal. Long deployments appear
idle, while the final terminal output is difficult to scan. Operators need
live progress in the terminal and a separate durable result file containing
only connection and model information.

## Files Affected

- `src/utils/azureCliDeployment/bash.ts` - Add staged Bash progress, per-model
  status, and deployment summaries.
- `src/utils/azureCliDeployment/powershell.ts` - Add equivalent PowerShell
  progress and summaries.
- `src/utils/azureCliDeployment/report.ts` - Keep full result details in the
  report file and remove terminal report rendering.
- `src/utils/__tests__/azureCliDeployment*.test.ts` - Verify the new output
  contract and refresh exact-output compatibility hashes.

## Implementation Plan

1. Add consistent prerequisites, authentication, provider, resources, models,
   and summary sections to both generated script formats.
2. Track a reason, SKU, and capacity for every model result without changing
   deployment return-code behavior.
3. Show transient running status in interactive terminals and persistent final
   status lines for every model.
4. Print per-region and multi-region totals, but print the shared result path
   only once at the end of a multi-region script.
5. Write endpoints, the account key, available models, model details, and the
   existing machine-readable JSON blocks only to the result file.

## Testing

- Assert staged progress, per-model status, summaries, and report-path output
  for Bash and PowerShell generators.
- Assert terminal report functions are absent while result-file fields and JSON
  markers remain present.
- Verify multi-region aggregation and a single final report-path notice.
- Run generated-script syntax checks where the required shells are available,
  then run `npm run verify`.

## Risks/Considerations

- Report files contain plaintext account keys by design and must remain local.
- Azure CLI errors remain visible, but Service Principal secrets must never be
  included in progress or diagnostic output.
- ARM output, configuration schemas, and deployment-result import contracts are
  unchanged.
