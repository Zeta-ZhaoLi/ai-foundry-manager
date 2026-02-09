# azure-deployment-code-export Specification

## MODIFIED Requirements

### Requirement: Template-Driven Deployment Row Defaults

When a region deployment row is initialized without saved values, the system MUST keep `modelName` fixed by selected models and resolve default `deploymentName`, `version`, and `capacity` from `Azure-AI-Founryd-Deployment-Template.json`.

If a template contains multiple entries for the same `modelName`, the system MUST choose a deterministic default entry.

#### Scenario: Multiple deployment names exist for one model

**Given** a selected model `modelName` has multiple template `modelDeployments` entries

**And** the row has no saved deployment values

**When** deployment rows are initialized

**Then** the system MUST pick one deterministic template entry for defaults

**And** row `modelName` MUST remain unchanged

#### Scenario: Exact deploymentName match syncs version and capacity

**Given** a row has fixed `modelName`

**And** user-entered `deploymentName` exactly matches a template entry with the same `modelName`

**When** deployment row values are processed

**Then** row `version` MUST be synchronized to the matched template entry `version`

**And** row `capacity` MUST be synchronized to the matched template entry `capacity`

---

## ADDED Requirements

### Requirement: DeploymentName Model Integrity

Deployment rows MUST prevent model identity drift via `deploymentName` edits.

#### Scenario: DeploymentName cannot switch modelName

**Given** a row with fixed `modelName`

**And** `deploymentName` matches a template entry whose `modelName` differs from the row `modelName`

**When** the user attempts copy/export

**Then** the system MUST block copy/export with an actionable validation error

**And** MUST NOT mutate row `modelName`

#### Scenario: DeploymentName must include row modelName

**Given** a deployment row has fixed `modelName`

**When** the row `deploymentName` does not include that `modelName`

**Then** the system MUST treat the row as invalid for copy/export

**And** MUST show a validation error indicating `deploymentName` must include `modelName`
