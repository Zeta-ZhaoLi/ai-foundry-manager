# Design: Deployment Row Mapping Integrity

## Context

Deployment defaults currently use a single `modelName` keyed map. This cannot fully represent template data where one `modelName` can have multiple `deploymentName` variants. We also need strict integrity guarantees: editing `deploymentName` must not switch model identity.

## Goals

- Preserve the 4-column deployment row contract (`modelName`, `deploymentName`, `version`, `capacity`).
- Support many deployment names per model from template source.
- Keep `modelName` immutable per selected row.
- Synchronize `version`/`capacity` from exact template match when possible.
- Enforce `deploymentName` contains row `modelName`.

## Non-Goals

- Introducing extra user-configurable mapping rules.
- Rewriting export template mechanics.

## Proposed Data Model

Build two lookups from `variables.modelDeployments`:

1. `defaultsByModelName: Map<string, TemplateEntry[]>`
2. `entryByDeploymentName: Map<string, TemplateEntry>`

Where `TemplateEntry` is `{ deploymentName, modelName, version, capacity }`.

## Row Initialization Behavior

- For each selected `modelName` row:
  - If saved row exists, keep saved values.
  - Else pick deterministic default from `defaultsByModelName.get(modelName)` first entry.
  - Else fallback to legacy defaults.

## Edit-Time Behavior (deploymentName)

When user edits `deploymentName`:

1. Validate `deploymentName` includes row `modelName`.
2. If `entryByDeploymentName` has exact match:
   - If matched `modelName` equals row `modelName`, sync row `version` and `capacity` from template entry.
   - If matched `modelName` differs, mark row invalid (do not mutate row `modelName`).
3. If no template match, keep user-entered `deploymentName`; do not auto-overwrite `version`/`capacity`.

## Validation Behavior

- Existing checks remain (required fields, unique deployment names, positive integer capacity).
- Add check: `deploymentName` must contain row `modelName`.
- Add check: if `deploymentName` maps to template entry with different model, reject export for that row.

## Test Strategy

- Utility tests:
  - many deployment names for one model.
  - exact deploymentName match syncs version/capacity.
  - cross-model deploymentName match is rejected.
- Component tests:
  - row keeps modelName fixed on deploymentName edits.
  - containment rule triggers validation.
