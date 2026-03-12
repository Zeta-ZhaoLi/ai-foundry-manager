# azure-deployment-code-export Specification

## MODIFIED Requirements

### Requirement: Deployment Configuration Field Contract

The deployment configuration UI for export MUST remove `Subscription ID`, replace `Resource Group` with `Resource Name`, and map region `Resource Name` to template `parameters.resourceName.defaultValue`.

#### Scenario: User configures deployment metadata in region card

**Given** the user opens deployment configuration for a region

**When** deployment metadata fields are displayed

**Then** `Subscription ID` MUST NOT be shown

**And** `Resource Group` MUST NOT be shown

**And** `Resource Name` MUST be shown as a region-level input immediately after `API Key`

**And** `Resource Name` MUST remain manually editable by the user

#### Scenario: Foundry endpoint auto-filled resource name can still be edited

**Given** the user enters Foundry project endpoint `https://test-resource.services.ai.azure.com/api/projects/test-project`

**And** the system auto-fills `Resource Name` with `test-resource`

**When** the user manually changes `Resource Name` to `test-resource-custom`

**Then** the `Resource Name` input MUST accept and display `test-resource-custom`
