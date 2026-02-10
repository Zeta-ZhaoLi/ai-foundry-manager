# Design: Region-Scoped Resource Name

## Context

Deployment export currently depends on `account.deployment.resourceName`, while export action is executed per region. This creates a scope mismatch: one account may contain multiple regions that map to different Azure resources.

## Goals

- Make `Resource Name` region-scoped to match per-region deployment/export behavior.
- Place region `Resource Name` input directly after `API Key` in region configuration.
- Preserve user data via migration from account-level configs.
- Keep validation and privacy constraints equivalent to current behavior.

## Non-Goals

- Auto-deriving `Resource Name` from endpoint values.
- Introducing batch-edit operations for multiple regions.

## Data Model Changes

- Current:
  - `account.deployment.resourceName`
- Target:
  - `region.deployment.resourceName`

Proposed shape:

- `AccountDeploymentConfig` no longer carries `resourceName`.
- `RegionDeploymentConfig` includes optional `resourceName?: string` plus existing `models` map.

## Migration Strategy

During account load normalization:

1. Read legacy account-level `deployment.resourceName` (if present).
2. For each region:
   - If `region.deployment.resourceName` already exists, keep it.
   - Else if account-level value exists, copy it into `region.deployment.resourceName`.
3. Keep migration idempotent so repeated loads do not overwrite explicit region values.

This strategy preserves behavior for existing users while allowing immediate per-region divergence.

## UI and Interaction

- Remove account-level `Resource Name` input from account metadata grid.
- Add `Resource Name` input in region header controls directly after `API Key`.
- Input remains plain text/manual entry.
- In privacy mode, display masked placeholder and disable editing for this field, aligned with API key behavior.

## Export and Validation

- Deployment export in a region reads `region.deployment.resourceName`.
- Existing "missing resource name" validation remains, but now references region-level field ownership.
- ARM template output still maps to `parameters.resourceName.defaultValue` with no schema change.

## Test Strategy

- Hook-level tests for migration from account-level to region-level storage.
- UI tests for field placement (region card, after API key) and account-level field removal.
- Export tests ensuring region value is used in generated template.
- Privacy mode tests for masking/disabling region `Resource Name`.
