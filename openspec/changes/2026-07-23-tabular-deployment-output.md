# Tabular Deployment Output and Cross-Region Aggregation

## Summary

Generated Azure CLI Bash and PowerShell deployment scripts now render aligned
ASCII tables for model progress, completed deployment records, and regional
connection details. Multi-region deployments aggregate those tables once after
all regions finish.

## Motivation

Long model deployments were difficult to compare because status fields were
printed as variable-width text. Operators also needed one consolidated view of
the deployments and connection information returned by every region.

## Files Affected

- `src/utils/azureCliDeployment/bash.ts` - Emit fixed-column progress and
  multi-region summary output, including cleanup of temporary table data.
- `src/utils/azureCliDeployment/powershell.ts` - Emit the equivalent PowerShell
  tables and cleanup behavior.
- `src/utils/azureCliDeployment/report.ts` - Collect ordered TSV rows, render
  aligned model and region tables to the result file, and preserve the
  machine-readable deployment-result blocks.
- `src/utils/__tests__/azureCliDeployment*.test.ts` - Verify table structure,
  aggregation, and compatibility hashes.

## Implementation Plan

1. Print model progress using `Index`, `Deployment`, `Model`, `Status`, `SKU`,
   `Capacity`, and `Details` columns with dynamic name widths and fixed status
   columns.
2. Collect deployment and connection rows in a temporary directory. Preserve
   the selected region order and sort deployments by name within each region.
3. Print one deployment model table followed by one region information table;
   show complete endpoints and API keys in both terminal output and the local
   result report.
4. Keep available-model entries and the existing
   `AI_FOUNDRY_MANAGER_DEPLOYMENT_RESULT_JSON_BEGIN/END` payloads in the result
   file so deployment-result import remains compatible.
5. Remove temporary aggregation data after a single-region run or after the
   final multi-region summary.

## Testing

- Assert progress headers, status rows, model and region table ordering, and a
  single final multi-region table/path output for both shells.
- Preserve the existing deployment-result importer and JSON payload schema.
- Run TypeScript, ESLint, Vitest, and the production build.

## Risks/Considerations

- Result files contain plaintext API keys and must remain local.
- Azure CLI failures and actionable errors remain visible in the terminal;
  normal progress is kept out of the result file.
- ARM JSON and all public deployment-result/configuration interfaces are
  unchanged.
