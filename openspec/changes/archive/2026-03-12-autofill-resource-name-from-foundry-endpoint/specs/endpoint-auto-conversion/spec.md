# endpoint-auto-conversion Specification

## ADDED Requirements

### Requirement: Foundry Endpoint Resource Name Autofill

When the user enters a valid Foundry project endpoint, the system MUST derive the Azure `resourceName` from the endpoint hostname and populate the region deployment `Resource Name` field.

#### Scenario: Valid Foundry project endpoint populates region resource name

**Given** a region has an empty `region.deployment.resourceName`

**When** the user enters Foundry project endpoint `https://test-resource.services.ai.azure.com/api/projects/test-project`

**Then** the system MUST populate `region.deployment.resourceName` with `test-resource`

**And** the existing endpoint cross-fill behavior MUST still populate the other supported endpoint fields

#### Scenario: Resource name is derived from host instead of projectId

**Given** a region has an empty `region.deployment.resourceName`

**When** the user enters Foundry project endpoint `https://pedrolaureanoferreira68-resource.services.ai.azure.com/api/projects/pedrolaureanoferreira68-6863`

**Then** the system MUST populate `region.deployment.resourceName` with `pedrolaureanoferreira68-resource`

**And** the system MUST NOT use `pedrolaureanoferreira68-6863` as the resource name

#### Scenario: Invalid Foundry endpoint preserves existing resource name

**Given** a region has `region.deployment.resourceName = "existing-resource"`

**When** the user enters Foundry project endpoint `https://example.com/api/projects/test-project`

**Then** the system MUST NOT clear or overwrite `region.deployment.resourceName`

**And** the field value MUST remain `existing-resource`
