# Azure Deployment Code Export

## MODIFIED Requirements

### Requirement: Template-Driven Deployment Row Defaults

When a region deployment row is initialized without saved values, the system MUST keep `modelName` fixed by selected models and resolve default `deploymentName`, `version`, `modelFormat`, and `capacity` from `Azure-AI-Founryd-Deployment-Template.json`.

If a template contains multiple entries for the same `modelName`, the system MUST choose a deterministic default entry.

#### Scenario: Multiple deployment names exist for one model

**Given** a selected model `modelName` has multiple template `modelDeployments` entries

**And** the row has no saved deployment values

**When** deployment rows are initialized

**Then** the system MUST pick one deterministic template entry for defaults

**And** row `modelName` MUST remain unchanged

**And** row `modelFormat` MUST default to that template entry `modelFormat`

#### Scenario: Exact deploymentName match syncs version, modelFormat, and capacity

**Given** a row has fixed `modelName`

**And** user-entered `deploymentName` exactly matches a template entry with the same `modelName`

**When** deployment row values are processed

**Then** row `version` MUST be synchronized to the matched template entry `version`

**And** row `modelFormat` MUST be synchronized to the matched template entry `modelFormat`

**And** row `capacity` MUST be synchronized to the matched template entry `capacity`

#### Scenario: Missing template entry uses safe fallback model format

**Given** a selected model has no valid template default entry

**And** the row has no saved `modelFormat`

**When** deployment rows are initialized

**Then** row `modelFormat` MUST default to `OpenAI`

---

### Requirement: Validation and Errors

If required inputs are missing, the system MUST not generate deployment code and MUST show an actionable error.

#### Scenario: Missing model format blocks copy

**Given** a region deployment row is enabled for export

**And** the row `modelFormat` is empty after trimming

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST show an actionable error indicating missing `modelFormat`

**And** MUST NOT copy any deployment code

## ADDED Requirements

### Requirement: Region Deployment Table Includes Editable Model Format

Each region deployment table row MUST include an editable `modelFormat` field.

#### Scenario: Model format column placement

**Given** the model deployment table is expanded

**When** table headers are rendered

**Then** a `modelFormat` column MUST appear immediately to the right of `version`

#### Scenario: Template-backed model format is auto-filled and editable

**Given** a selected model has a matching template entry with `modelFormat`

**When** deployment rows are initialized

**Then** row `modelFormat` MUST be auto-filled from the template

**And** the user MUST be able to edit row `modelFormat`

**And** the edited value MUST be persisted in region deployment model config

---

### Requirement: Exported Template Carries Row Model Format

Copied deployment JSON MUST include per-row `modelFormat` in `variables.modelDeployments`.

#### Scenario: Export preserves edited model format

**Given** the user edits a deployment row `modelFormat`

**And** all required deployment inputs are valid

**When** the user clicks "Copy Deployment Code"

**Then** exported `variables.modelDeployments[]` entries MUST include that edited `modelFormat`

**And** exported template resources MUST continue referencing `variables('modelDeployments')[...].modelFormat` for `properties.model.format`
