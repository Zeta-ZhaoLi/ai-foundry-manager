# Allow Case-Insensitive DeploymentName Model Match

## Why

- Current deployment validation requires `deploymentName` to include `modelName` with case-sensitive matching.
- Real model naming often mixes case styles (for example `DeepSeek-V3.2` vs `deepseek-v3.2-251201`), causing valid rows to be blocked.
- Users also expect template-defined deployment/model combinations to be treated as valid, even when plain substring checks are strict.

## What Changes

- Change the "`deploymentName` must include `modelName`" validation to be case-insensitive.
- Treat template-defined `(deploymentName, modelName)` combinations as valid when model identity matches case-insensitively.
- Keep existing protection that blocks model drift when template `deploymentName` points to a different `modelName`.
- Add/adjust tests for:
  - case-insensitive include pass;
  - template combination pass;
  - true model mismatch still blocked.

## Scope

- In scope:
  - Region deployment validation logic for `deploymentName`/`modelName` matching.
  - Related deployment export tests.
  - Spec updates for deployment validation behavior.
- Out of scope:
  - New template format or migration.
  - Fuzzy model aliasing beyond case-insensitive comparisons.

## Current Behavior Notes

- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` currently checks `deploymentName.includes(modelName)` case-sensitively.
- Template lookup by `deploymentName` already exists and is used to block mismatched model mappings.
- Existing spec requirement `DeploymentName must include row modelName` does not define case-insensitive behavior or explicit template-combination override.

## Risks and Mitigations

- Risk: Loosening checks may allow unintended mismatches.
  - Mitigation: keep template mismatch block and compare model identity case-insensitively only (no fuzzy alias rules).
- Risk: Behavior drift between validation and row auto-sync logic.
  - Mitigation: cover both manual export validation and template-match scenarios with tests.
