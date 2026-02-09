# Adopt Foundry Deployment Template Defaults

## Why

- The deployment code generator currently references `mainTemplate.json`, but the repository now keeps the canonical template in `Azure-AI-Founryd-Deployment-Template.json`.
- Region deployment rows currently default to manual values (`version` empty, `capacity` set to `1000`) instead of using model-specific defaults from the template.
- This mismatch creates drift between exported deployment code and the latest template-maintained model baseline.
- Current deployment configuration fields include obsolete terminology/inputs (`Subscription ID`, `Resource Group`) that do not map cleanly to the template contract.

## What Changes

- Switch the deployment code export baseline from `mainTemplate.json` to `Azure-AI-Founryd-Deployment-Template.json`.
- Treat row `modelName` as fixed model identity and initialize row `deploymentName` from template defaults.
- Add template-driven default resolution so each deployment row auto-fills `deploymentName`, `version`, and `capacity` by matching row `modelName` against `variables.modelDeployments` in the template.
- Simplify deployment configuration inputs:
  - remove `Subscription ID`.
  - rename `Resource Group` to `Resource Name` and bind it to template `parameters.resourceName.defaultValue`.
  - in model deployment rows, remove `resourceName (AOAI 资源名称)`.
  - use the region's deployed Azure area code directly as `location`.
- Preserve existing manual override behavior so users can edit per-region deployment rows after defaults are populated.
- Keep validation behavior for model rows unchanged: missing/invalid row inputs still block copy/export and show actionable errors.

## Scope

- In scope:
  - Deployment template import/source-of-truth update.
  - Region deployment defaults derived from template model entries.
  - Deployment configuration field contract cleanup (`Subscription ID` removal, `Resource Group` -> `Resource Name`, region-code `location`).
  - Specs and tests for template source and default mapping behavior.
- Out of scope:
  - Changes to Azure template schema beyond reading existing `modelDeployments` entries.
  - New UI controls for selecting alternative templates.

## Current Behavior Notes

- `src/utils/armTemplate.ts` still imports `../../mainTemplate.json` as canonical.
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` initializes deployment rows with `deploymentName: modelName`, `version: ''`, and `capacity: 1000` when no saved config exists.
- The root template file `Azure-AI-Founryd-Deployment-Template.json` already includes model-specific `modelName`/`version`/`capacity` defaults.
- Current deployment configuration still exposes fields that will be replaced/removed by this proposal.

## Risks and Mitigations

- Risk: Template may not include every model selected in a region.
  - Mitigation: Fall back to current behavior for unmatched models (`deploymentName` defaults to `modelName`, `version` empty, default `capacity`), so validation remains explicit and predictable.
- Risk: Template structure changes unexpectedly.
  - Mitigation: Add defensive parsing/runtime checks and unit tests for malformed or missing `modelDeployments` data.
