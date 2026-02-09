# Azure Deployment Code Export

## MODIFIED Requirements

### Requirement: Region Deployment Code Output

The region deployment section MUST provide an action to copy the full deployment code.

"Full deployment code" MUST be a complete ARM template JSON derived from `Azure-AI-Founryd-Deployment-Template.json`.

#### Scenario: Copy deployment code

**Given** a region has selected models with valid deployment rows

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST copy a complete ARM template JSON to the clipboard

**And** the copied template MUST preserve non-model sections from `Azure-AI-Founryd-Deployment-Template.json`

---

## ADDED Requirements

### Requirement: Deployment Configuration Field Contract

The deployment configuration UI for export MUST remove `Subscription ID`, replace `Resource Group` with `Resource Name`, and map `Resource Name` to template `parameters.resourceName.defaultValue`.

#### Scenario: User configures deployment metadata

**Given** the user opens deployment configuration for a region

**When** deployment metadata fields are displayed

**Then** `Subscription ID` MUST NOT be shown

**And** `Resource Group` MUST NOT be shown

**And** `Resource Name` MUST be shown as the field used for template `resourceName`

#### Scenario: Export maps resource name to template

**Given** the user provides deployment `Resource Name`

**When** the user clicks "Copy Deployment Code"

**Then** exported template `parameters.resourceName.defaultValue` MUST equal that `Resource Name`

---

### Requirement: Location Uses Region Code

Deployment export MUST use the region deployment area code directly as template `location`.

#### Scenario: Export uses region code for location

**Given** a region has a deployment area code

**When** the user clicks "Copy Deployment Code"

**Then** exported template `parameters.location.defaultValue` MUST equal that region code

---

### Requirement: Template-Driven Deployment Row Defaults

When a region deployment row is initialized without saved values, the system MUST treat `modelName` as fixed identity and resolve default `deploymentName`, `version`, and `capacity` from `Azure-AI-Founryd-Deployment-Template.json` by matching `modelName` against `variables.modelDeployments`.

#### Scenario: Matching model receives template defaults

**Given** a selected model has no saved deployment row values

**And** `variables.modelDeployments` contains an entry whose `modelName` equals the selected model

**When** the deployment rows are initialized

**Then** the row `modelName` MUST remain the selected model

**And** the row `deploymentName` MUST default to the template entry `deploymentName`

**And** the row `version` MUST default to the template entry `version`

**And** the row `capacity` MUST default to the template entry `capacity`

#### Scenario: Model missing from template falls back safely

**Given** a selected model has no saved deployment row values

**And** no valid matching template entry exists for that `modelName`

**When** the deployment rows are initialized

**Then** the system MUST fall back to legacy defaults

**And** the row `deploymentName` MUST default to `modelName`

**And** existing validation MUST still require users to provide any missing required values before copy/export

---

### Requirement: Model Row Removes Resource Name Field

Model deployment rows MUST NOT include `resourceName (AOAI 资源名称)` as a per-row field.

#### Scenario: User edits model deployment rows

**Given** the model deployment table is visible

**When** row-level editable fields are rendered

**Then** row-level `resourceName (AOAI 资源名称)` MUST NOT be present
