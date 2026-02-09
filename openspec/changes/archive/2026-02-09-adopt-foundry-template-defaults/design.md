# Design: Template-Driven Deployment Defaults

## Context

Deployment code export and deployment-row initialization both depend on template assumptions. The canonical template file was renamed to `Azure-AI-Founryd-Deployment-Template.json`, but current code/spec language still references `mainTemplate.json`. In addition, the UI does not currently consume template model defaults for `version` and `capacity`.

## Goals

- Use `Azure-AI-Founryd-Deployment-Template.json` as the single deployment template baseline.
- Keep row `modelName` as fixed identity and resolve per-model default `deploymentName`, `version`, and `capacity` values from template `variables.modelDeployments`.
- Align deployment configuration fields with template contract: remove `Subscription ID`, rename `Resource Group` to `Resource Name` (`resourceName`), and derive `location` from region code.
- Keep user edits and validation semantics stable.

## Non-Goals

- Supporting dynamic template uploads or multiple template sources.
- Changing validation rules for required deployment inputs.

## Proposed Approach

1. Add a small utility in deployment template logic that builds a lookup map from template `variables.modelDeployments`, keyed by `modelName`.
2. Reuse that lookup when initializing region deployment rows:
   - Row `modelName` is always the selected model and is not replaced by template data.
   - If region-specific value exists, keep it.
   - Else, if template default exists for that model, use template `deploymentName`, `version`, and `capacity`.
   - Else, fall back to legacy defaults (`deploymentName = modelName`, empty `version`, default `capacity`).
3. Update deployment code builder import/source to `Azure-AI-Founryd-Deployment-Template.json` and align requirement wording.
4. Normalize deployment config inputs:
   - Remove `Subscription ID` from UI/state used by deployment export.
   - Replace `Resource Group` label/field with `Resource Name`, mapped to template `resourceName`.
   - In model deployment rows, remove `resourceName (AOAI 资源名称)`.
   - Set `location` directly from the region deployment area code (region identity), not manual row-level input.

## Data Contract

- Input source: `variables.modelDeployments[]` entries with fields:
  - `deploymentName: string`
  - `modelName: string`
  - `version: string`
  - `capacity: number`
- Lookup behavior:
  - First matching entry by exact `modelName` is used.
  - Invalid `deploymentName`, non-string `version`, or non-positive/non-integer `capacity` is treated as invalid and ignored.

## Edge Cases

- Model not found in template: keep legacy fallback so users can still fill values manually.
- Duplicate template entries for same `modelName`: use first valid entry to keep deterministic behavior.
- Missing/invalid `variables.modelDeployments`: silently degrade to legacy fallback and rely on existing validation during copy action.
- Region code missing or malformed: keep current copy/export guardrails and show actionable location error.

## Validation Strategy

- Unit tests for lookup parsing and fallback behavior.
- Unit/integration-level tests confirming row defaults in region deployment UI logic.
- Existing export tests updated to assert template source path and successful substitutions.
