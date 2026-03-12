## ADDED Requirements

### Requirement: Exported Deployment Code Creates Foundry Project

Copied deployment code MUST create the Foundry project required by the region's Foundry project endpoint, not just the Azure AI account and model deployments.

#### Scenario: Copied template includes Foundry project creation

**Given** a region has a valid deployment `Resource Name`

**And** the region has one or more enabled deployment rows with valid model settings

**When** the user clicks "Copy Deployment Code"

**Then** the copied template MUST include a Foundry project resource derived from the region's effective project identity

**And** that project resource MUST depend on the Azure AI account resource in the same template

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
