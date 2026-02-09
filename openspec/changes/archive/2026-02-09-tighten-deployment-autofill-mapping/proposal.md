# Tighten Deployment Autofill Mapping

## Why

- The deployment table already shows four fields (`modelName`, `deploymentName`, `version`, `capacity`), but current autofill is primarily keyed by `modelName` and only uses one template default per model.
- The template can contain multiple `deploymentName` variants for the same `modelName`, and users need row behavior that stays consistent with template entries.
- We must prevent accidental or intentional model substitution via `deploymentName` edits (no stealth model swapping).

## What Changes

- Keep the deployment table as four columns aligned with template parameters: `modelName`, `deploymentName`, `version`, `capacity`.
- Update autofill logic to support both mappings from template `variables.modelDeployments`:
  - `modelName -> candidate deployment defaults`
  - `deploymentName -> exact template entry`
- Enforce model integrity rules:
  - `modelName` remains fixed by selected model rows and cannot be changed by `deploymentName` edits.
  - `deploymentName` must include the row `modelName` string.
  - If a `deploymentName` matches a template entry whose `modelName` differs from the row `modelName`, reject or flag as invalid instead of switching the row model.
- When `deploymentName` matches a valid template entry for the same row `modelName`, keep the matched `deploymentName` and sync `version` + `capacity` from that template entry.

## Scope

- In scope:
  - Deployment-row autofill and validation behavior.
  - Template lookup enhancements for many-to-one (`deploymentName` to `modelName`) relationships.
  - Spec and test updates for mapping integrity rules.
- Out of scope:
  - New UI columns/major layout redesign.
  - Changing ARM export schema.

## Clarified Rule (User Confirmed)

- `deploymentName` must contain `modelName`.
- The system must not alter row `modelName` based on `deploymentName` input.

## Risks and Mitigations

- Risk: Existing saved rows may contain legacy `deploymentName` values that violate new containment rules.
  - Mitigation: Keep data load non-destructive, but enforce validation before copy/export and provide actionable row-level errors.
- Risk: Multiple template entries for same `modelName` may lead to ambiguous default pick.
  - Mitigation: Define deterministic default selection order (first valid template entry for that model unless a specific `deploymentName` is matched).
