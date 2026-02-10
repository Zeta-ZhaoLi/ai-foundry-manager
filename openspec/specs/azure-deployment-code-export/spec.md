# azure-deployment-code-export Specification

## Purpose
TBD - created by archiving change 2026-01-29-preserve-model-lines-and-export-deploy-code. Update Purpose after archive.
## Requirements
### Requirement: Region Deployment Code Output

The region deployment section MUST provide an action to copy the full deployment code.

"Full deployment code" MUST be a complete ARM template JSON derived from `Azure-AI-Founryd-Deployment-Template.json`.

#### Scenario: Copy deployment code

**Given** a region has selected models with valid deployment rows

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST copy a complete ARM template JSON to the clipboard

**And** the copied template MUST preserve non-model sections from `Azure-AI-Founryd-Deployment-Template.json`

---

### Requirement: Validation and Errors

If required inputs are missing, the system MUST not generate deployment code and MUST show an actionable error.

#### Scenario: Missing region resourceName

**Given** a region deployment config has no `region.deployment.resourceName`

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST show an error indicating the missing `resourceName`

**And** MUST NOT copy any deployment code

---

### Requirement: Replace Portal-Based One-Click Deploy

The Portal-based one-click deploy workflow MUST be removed/replaced by the deployment code copy action.

#### Scenario: No Portal open on deploy

**Given** the region deployment section is available

**When** the user triggers deployment output

**Then** the system MUST NOT open Azure Portal automatically

**And** MUST NOT download files automatically

---

### Requirement: Copy Is One-Click

The deployment code export MUST be copyable via a single UI action.

#### Scenario: No manual select needed

**Given** the deployment code export UI is available

**When** the user clicks "Copy Deployment Code"

**Then** the clipboard MUST contain the full template JSON without requiring manual text selection

### Requirement: Deployment Configuration Field Contract

The deployment configuration UI for export MUST remove `Subscription ID`, replace `Resource Group` with `Resource Name`, and map region `Resource Name` to template `parameters.resourceName.defaultValue`.

#### Scenario: User configures deployment metadata in region card

**Given** the user opens deployment configuration for a region

**When** deployment metadata fields are displayed

**Then** `Subscription ID` MUST NOT be shown

**And** `Resource Group` MUST NOT be shown

**And** `Resource Name` MUST be shown as a region-level input immediately after `API Key`

**And** `Resource Name` MUST be manually editable by the user

#### Scenario: Export maps region resource name to template

**Given** the user provides deployment `Resource Name` in a region

**When** the user clicks "Copy Deployment Code"

**Then** exported template `parameters.resourceName.defaultValue` MUST equal that region `Resource Name`

---

### Requirement: Location Uses Region Code

Deployment export MUST use the region deployment area code directly as template `location`.

#### Scenario: Export uses region code for location

**Given** a region has a deployment area code

**When** the user clicks "Copy Deployment Code"

**Then** exported template `parameters.location.defaultValue` MUST equal that region code

---

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

### Requirement: Model Row Removes Resource Name Field

Model deployment rows MUST NOT include `resourceName (AOAI 资源名称)` as a per-row field.

#### Scenario: User edits model deployment rows

**Given** the model deployment table is visible

**When** row-level editable fields are rendered

**Then** row-level `resourceName (AOAI 资源名称)` MUST NOT be present

### Requirement: Account-Level Resource Name Input Placement

Deployment `Resource Name` ownership MUST be region-scoped and MUST NOT be configured at account scope.

#### Scenario: Account card does not host resource name

**Given** the user opens an account card

**When** account info fields are rendered

**Then** account-level `Resource Name` input MUST NOT be present

#### Scenario: Region deployment uses region resource name

**Given** an account has multiple regions with different `Resource Name` values

**When** each region exports deployment code

**Then** each exported template `resourceName` MUST use that specific region's `Resource Name`

### Requirement: DeploymentName Model Integrity

Deployment rows MUST prevent model identity drift via `deploymentName` edits.

#### Scenario: DeploymentName cannot switch modelName

**Given** a row with fixed `modelName`

**And** `deploymentName` matches a template entry whose `modelName` differs from the row `modelName` (case-insensitive comparison)

**When** the user attempts copy/export

**Then** the system MUST block copy/export with an actionable validation error

**And** MUST NOT mutate row `modelName`

#### Scenario: DeploymentName includes modelName case-insensitively

**Given** a deployment row has fixed `modelName = "DeepSeek-V3.2"`

**When** the row `deploymentName = "deepseek-v3.2-251201"`

**Then** the system MUST treat the row as valid for this rule

**And** MUST NOT fail only because of case differences

#### Scenario: Template-defined deployment/model combination is allowed

**Given** template contains an entry with `deploymentName = "deepseek-v3.2-251201"` and `modelName = "DeepSeek-V3.2"`

**And** a row uses the same `deploymentName`

**And** row `modelName` is the same model identity (case-insensitive)

**When** the user attempts copy/export

**Then** the system MUST allow this row for deployment validation

### Requirement: Legacy Resource Name Migration Compatibility

When loading legacy configs that only contain account-level `deployment.resourceName`, the system MUST migrate values to each region so existing deployments continue to work.

#### Scenario: Fan out legacy account resource name to regions

**Given** a stored account has `deployment.resourceName = "legacy-aoai"`

**And** regions do not have `region.deployment.resourceName`

**When** the configuration is loaded and normalized

**Then** each region MUST receive `region.deployment.resourceName = "legacy-aoai"`

**And** export validation MUST pass for `resourceName` if other required fields are valid

#### Scenario: Preserve explicit region-level values

**Given** a stored account has legacy account-level `deployment.resourceName`

**And** one or more regions already have `region.deployment.resourceName`

**When** the configuration is loaded and normalized

**Then** existing region-level `resourceName` values MUST be preserved

**And** migration MUST NOT overwrite those region values

