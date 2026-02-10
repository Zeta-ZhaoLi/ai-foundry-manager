# Add Model Format to Deployment Export Flow

## Why

- `Azure-AI-Founryd-Deployment-Template.json` now defines `modelFormat` for each `variables.modelDeployments` entry, and the deployment resource reads `properties.model.format` from that field.
- The current generated deployment payload still builds rows with only `deploymentName`, `modelName`, `version`, and `capacity`, so exported code can drift from the updated template contract.
- The region deployment table currently has no editable `modelFormat` column, so users cannot review or override model format per deployment row.

## What Changes

- Extend the deployment row contract to include `modelFormat` end-to-end (template lookup, region state, validation, and exported template payload).
- Update template-default resolution so models that exist in `Azure-AI-Founryd-Deployment-Template.json` auto-fill `modelFormat` together with `deploymentName`, `version`, and `capacity`.
- Add a `modelFormat` column to each region’s deployment table immediately after `version`, keep it editable, and persist edits in region deployment config.
- Ensure copied deployment JSON includes row-level `modelFormat` in `variables.modelDeployments` so the generated deployment resource uses the chosen format.
- Add/adjust tests for lookup parsing, row defaulting, UI editability, and export output.

## Scope

- In scope:
  - Deployment data model and template lookup updates for `modelFormat`.
  - Region deployment UI column/behavior changes for editable `modelFormat`.
  - Export generation + validation updates and related tests/spec deltas.
- Out of scope:
  - Changing Azure template schema beyond consuming current `modelFormat` fields.
  - Adding dropdown catalogs or remote validation for allowed model formats.

## Assumptions

- Canonical field name is `modelFormat` (template contract); user text `modelFormate` is treated as a typo for UI label/description purposes.
- For legacy saved rows that do not yet contain `modelFormat`, initialization falls back deterministically (template match first, otherwise safe fallback) without breaking existing configs.

## Risks and Mitigations

- Risk: Existing local configs lack `modelFormat` and fail export after upgrade.
  - Mitigation: Define backward-compatible defaulting path during row initialization before validation.
- Risk: Template entries with malformed `modelFormat` values produce inconsistent defaults.
  - Mitigation: Keep defensive parsing; ignore invalid entries and use fallback defaults.
