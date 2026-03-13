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

#### Scenario: Missing model format blocks copy

**Given** a region deployment row is enabled for export

**And** the row `modelFormat` is empty after trimming

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST show an actionable error indicating missing `modelFormat`

**And** MUST NOT copy any deployment code

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

**And** an auto-generate action MUST be shown to the right of the `Resource Name` input

**And** `Resource Name` MUST remain manually editable by the user

#### Scenario: Generated resource name can still be edited

**Given** the system generated `Resource Name` for a region

**When** the user manually changes `Resource Name`

**Then** the `Resource Name` input MUST accept and display the manual value

### Requirement: Location Uses Region Code

Deployment export MUST use the region deployment area code directly as template `location`.

#### Scenario: Export uses region code for location

**Given** a region has a deployment area code

**When** the user clicks "Copy Deployment Code"

**Then** exported template `parameters.location.defaultValue` MUST equal that region code

---

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

### Requirement: Deployment Selection Column Uses Select Label

In each region deployment table, the first column header for row inclusion MUST use localized `Select` wording instead of legacy include/join wording.

#### Scenario: Deployment header shows select wording

**Given** the user expands a region's deployment table

**When** the first column header is rendered

**Then** the header label MUST display localized `Select` semantics (for example, `选择` in `zh`, `Select` in `en`)

**And** the UI MUST NOT display legacy include/join wording for that header

---

### Requirement: Deployment Bulk Selection Uses Single Tri-State Checkbox

Each region deployment table MUST provide one header checkbox that cycles three bulk actions for row `enabled` state: select all, invert selection, and select none.

#### Scenario: Three clicks execute invert/all/none in order

**Given** a region deployment table has one or more rows

**And** the header tri-state checkbox is available

**When** the user clicks the header checkbox the first time in the cycle

**Then** each deployment row MUST toggle from its pre-click enabled state (`invert selection`)

**When** the user clicks the header checkbox the second time in the cycle

**Then** all deployment rows MUST become enabled (`select all`)

**When** the user clicks the header checkbox the third time in the cycle

**Then** all deployment rows MUST become disabled (`select none`)

#### Scenario: Bulk actions do not require extra action buttons or text labels

**Given** the user views a region deployment table

**When** bulk selection controls are rendered

**Then** select all, invert selection, and select none MUST be reachable through the single header checkbox cycle

**And** the deployment table MUST NOT add separate bulk-action buttons or text labels for these three actions

### Requirement: Exported Deployment Code Creates Foundry Project

Copied deployment code MUST create the Foundry project required by the region's Foundry project endpoint, not just the Azure AI account and model deployments.

#### Scenario: Copied template includes Foundry project creation

**Given** a region has a valid deployment `Resource Name`

**And** the region has one or more enabled deployment rows with valid model settings

**When** the user clicks "Copy Deployment Code"

**Then** the copied template MUST include a Foundry project resource derived from the region's effective project identity

**And** that project resource MUST depend on the Azure AI account resource in the same template

**And** that project resource MUST include `location = [parameters('location')]`

**And** that project resource MUST include `identity.type = SystemAssigned`

**And** that project resource `properties.displayName` MUST equal `[parameters('projectName')]`

**And** that project resource `properties.description` MUST equal `AI project`

### Requirement: Deployment Export Resolves Effective Foundry Project Identity

Deployment export MUST resolve one effective Foundry project identity for template generation.

#### Scenario: Valid explicit Foundry endpoint wins during export

**Given** a region has `Resource Name = "sample-1234-resource"`

**And** `Foundry Project Endpoint = "https://sample-1234-resource.services.ai.azure.com/api/projects/sample-custom-project"`

**When** the user clicks "Copy Deployment Code"

**Then** the exported template MUST create the Foundry project `sample-custom-project`

**And** the system MUST NOT replace it with a project identifier derived from `Resource Name`

#### Scenario: Empty Foundry endpoint derives project from resource name

**Given** a region has `Resource Name = "bakarahmed24-2561-resource"`

**And** `Foundry Project Endpoint` is empty

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST derive effective Foundry project endpoint `https://bakarahmed24-2561-resource.services.ai.azure.com/api/projects/bakarahmed24-2561`

**And** the exported template MUST create the Foundry project `bakarahmed24-2561`

#### Scenario: Invalid non-empty Foundry endpoint blocks export

**Given** a region has `Resource Name = "sample-1234-resource"`

**And** `Foundry Project Endpoint = "https://example.com/api/projects/not-azure"`

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST show an actionable validation error for the invalid Foundry project endpoint

**And** MUST NOT copy any deployment code

