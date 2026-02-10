# Design: Model Format in Deployment Rows and Export

## Context

The canonical template `Azure-AI-Founryd-Deployment-Template.json` now includes `modelFormat` on each `variables.modelDeployments[]` item, and deployment resources reference this field via `properties.model.format`. Current generated deployment rows and export payloads do not model this field, so the app cannot fully mirror template defaults or let users edit format per row.

## Goals

- Keep deployment export aligned with the latest template contract by carrying `modelFormat` end-to-end.
- Auto-fill `modelFormat` from template defaults for matching models.
- Expose `modelFormat` as an editable per-row value in region deployment UI (after version column).
- Preserve existing saved configs and manual override behavior.

## Non-Goals

- Enforcing provider-specific format taxonomies (for example, strict enum validation from Azure docs).
- Replacing editable text input with a managed dropdown in this change.

## Proposed Approach

1. **Template parsing contract**
   - Extend template deployment entry parsing to include `modelFormat` as a required non-empty string for valid entries.
   - Include `modelFormat` in both lookups:
     - by `modelName` defaults list
     - by `deploymentName` exact lookup

2. **Region row initialization**
   - When selected model row has saved deployment config, saved `modelFormat` wins.
   - Otherwise, if template default exists, use template `modelFormat`.
   - Otherwise, use fallback `modelFormat` (`OpenAI`) to stay compatible with previous hardcoded export behavior.

3. **UI contract**
   - Add `modelFormat` column immediately after `version` in region deployment table.
   - Keep value editable and stored in `region.deployment.models[model].modelFormat`.
   - Keep deployment-name sync behavior for same-model template matches; syncing should also refresh `modelFormat` together with `version` and `capacity`.

4. **Export + validation**
   - Include `modelFormat` in exported `variables.modelDeployments[]` for enabled rows.
   - Add validation: enabled row `modelFormat` must be non-empty before copy/export.

## Backward Compatibility

- Existing localStorage configs without `modelFormat` remain valid because missing values are synthesized at runtime through template/fallback defaults.
- No destructive migration is required; persisted schema can evolve lazily as users edit rows.

## Validation Strategy

- Unit tests for template lookup parsing and fallback behavior with/without valid `modelFormat`.
- Region deployment UI tests for column placement, auto-filled value, manual edit persistence, and deployment-name-triggered sync.
- Export tests to assert copied JSON contains `modelFormat` and fails when `modelFormat` is empty.
