# Move Resource Name to Region Level

## Why

- Current deployment config stores `Resource Name` at account scope, but Azure resources are often managed per region.
- One account can include multiple regions with different Azure resources, so a single shared `Resource Name` causes configuration drift and export mistakes.
- Users asked to move `Resource Name` to each region and place the input after `API Key`, with manual entry.

## What Changes

- Change deployment `Resource Name` scope from account-level to region-level.
- Remove account-level `Resource Name` input from account info.
- Add a region-level `Resource Name` input in region configuration, positioned immediately after `API Key`.
- Keep `Resource Name` as manual input (no auto-derived value from endpoint fields).
- Update deployment export to use the current region's `Resource Name` (`parameters.resourceName.defaultValue`).
- Keep existing validation behavior: copy/export is blocked when region `Resource Name` is missing.
- Update privacy-mode masking so region `Resource Name` is treated as sensitive and hidden when privacy mode is on.
- Add compatibility migration for existing saved configs:
  - For each existing region, if `region.deployment.resourceName` is empty and account-level `deployment.resourceName` exists, copy that value into the region.
  - Preserve any existing region-level value if already present.

## Scope

- In scope:
  - Data model and storage migration for `resourceName` from account to region scope.
  - Region UI placement/order change (after `API Key`).
  - Deployment export input binding update.
  - Privacy mode updates for new field location.
  - Spec and test updates.
- Out of scope:
  - Endpoint-based auto-fill for `Resource Name`.
  - New bulk-edit tools for setting one `Resource Name` across many regions.

## Current Behavior Notes

- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` renders `Resource Name` in account info and saves to `account.deployment.resourceName`.
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` reads `accountDeployment?.resourceName` for deployment export validation and template generation.
- `src/hooks/useLocalAzureAccounts.ts` defines `AccountDeploymentConfig.resourceName` and currently does not persist a region-level deployment `resourceName`.
- `openspec/specs/azure-deployment-code-export/spec.md` currently requires account-level placement for `Resource Name`.
- `openspec/specs/privacy-mode-redaction/spec.md` currently defines masking for account-level `Resource Name`.

## Risks and Mitigations

- Risk: Existing users may lose deploy ability if migrated regions end up with empty `Resource Name`.
  - Mitigation: migrate existing account-level `resourceName` into each existing region when region value is missing.
- Risk: UI move may confuse users used to account-level field.
  - Mitigation: place field right after `API Key` and keep existing label text (`Resource Name`) to minimize cognitive overhead.
- Risk: Inconsistent data shape during migration.
  - Mitigation: normalize on load and write tests for mixed legacy/new configurations.
