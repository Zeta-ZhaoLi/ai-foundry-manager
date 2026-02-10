# Azure Deployment Code Export

## MODIFIED Requirements

### Requirement: Validation and Errors

If required inputs are missing, the system MUST not generate deployment code and MUST show an actionable error.

#### Scenario: Missing region resourceName

**Given** a region deployment config has no `region.deployment.resourceName`

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST show an error indicating the missing `resourceName`

**And** MUST NOT copy any deployment code

---

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

## ADDED Requirements

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
