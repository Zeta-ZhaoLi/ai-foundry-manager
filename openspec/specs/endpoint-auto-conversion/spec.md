# endpoint-auto-conversion Specification

## Purpose
TBD - created by archiving change 2025-12-21-add-account-prefixes-and-endpoint-conversion. Update Purpose after archive.
## Requirements
### Requirement: OpenAI to Anthropic Auto-Generation

The system MUST support cross-fill across all supported Azure AI Foundry endpoint forms. When a user inputs any one supported endpoint, the system MUST derive and populate the remaining endpoint fields.

#### Scenario: Input OpenAI endpoint auto-fills all other endpoint forms

**Given** a region with empty endpoint fields

**When** the user enters OpenAI Endpoint `https://test-resource.openai.azure.com`

**Then** the system MUST auto-fill:

- Foundry project endpoint `https://test-resource.services.ai.azure.com/api/projects/test-resource`
- Azure AI Services endpoint `https://test-resource.cognitiveservices.azure.com`
- Anthropic endpoint `https://test-resource.services.ai.azure.com/anthropic`

#### Scenario: Input Foundry project endpoint auto-fills all other endpoint forms

**Given** a region with empty endpoint fields

**When** the user enters Foundry project endpoint `https://test-resource.services.ai.azure.com/api/projects/test-project`

**Then** the system MUST auto-fill:

- OpenAI endpoint `https://test-resource.openai.azure.com`
- Azure AI Services endpoint `https://test-resource.cognitiveservices.azure.com`
- Anthropic endpoint `https://test-resource.services.ai.azure.com/anthropic`

---

### Requirement: Anthropic to OpenAI Auto-Generation

When a user inputs an Anthropic Endpoint, the system **SHALL** automatically generate the corresponding OpenAI Endpoint if the target field is empty or not manually overridden.

#### Scenario: Auto-generate OpenAI from Anthropic

**Given** a region configuration with empty endpoints

**When** the user enters Anthropic Endpoint "https://test-resource.services.ai.azure.com/anthropic"

**Then** the system automatically generates OpenAI Endpoint "https://test-resource.openai.azure.com"

**And** the OpenAI Endpoint field is populated

**And** a sync indicator (🔄) is displayed next to the OpenAI Endpoint

#### Scenario: Anthropic endpoint with path variations

**Given** a region configuration with empty endpoints

**When** the user enters Anthropic Endpoint "https://test-resource.services.ai.azure.com/anthropic/v1/messages"

**Then** the system normalizes it to "https://test-resource.services.ai.azure.com/anthropic"

**And** generates OpenAI Endpoint "https://test-resource.openai.azure.com"

#### Scenario: Update Anthropic updates OpenAI

**Given** a region with:
- Anthropic Endpoint: "https://old-resource.services.ai.azure.com/anthropic" (manually entered)
- OpenAI Endpoint: "https://old-resource.openai.azure.com" (auto-generated)

**When** the user changes Anthropic Endpoint to "https://new-resource.services.ai.azure.com/anthropic"

**Then** the system updates OpenAI Endpoint to "https://new-resource.openai.azure.com"

---

### Requirement: Resource Name Extraction

The system **MUST** correctly extract the Azure resource name from both OpenAI and Anthropic endpoint formats.

#### Scenario: Extract from OpenAI endpoint

**Given** an OpenAI Endpoint "https://my-resource-name.openai.azure.com"

**When** the system extracts the resource name

**Then** it returns "my-resource-name"

#### Scenario: Extract from Anthropic endpoint

**Given** an Anthropic Endpoint "https://my-resource-name.services.ai.azure.com/anthropic"

**When** the system extracts the resource name

**Then** it returns "my-resource-name"

#### Scenario: Complex resource names

**Given** an endpoint with resource name "baha-3340-resource"

**When** the system extracts the resource name

**Then** it correctly returns "baha-3340-resource"

**And** handles hyphens and numbers in the name

---

### Requirement: Invalid Endpoint Handling

The system **MUST** gracefully handle invalid or non-Azure endpoints without breaking functionality.

#### Scenario: Non-Azure URL

**Given** a region configuration

**When** the user enters OpenAI Endpoint "https://example.com/api"

**Then** the system does not generate an Anthropic Endpoint

**And** no error is shown

**And** the field remains as entered

#### Scenario: Malformed URL

**Given** a region configuration

**When** the user enters OpenAI Endpoint "not-a-valid-url"

**Then** the system does not generate an Anthropic Endpoint

**And** no error is shown

**And** the field remains as entered

#### Scenario: Empty endpoint

**Given** a region configuration with populated endpoints

**When** the user clears the OpenAI Endpoint (empty string)

**Then** the system does not throw an error

**And** the Anthropic Endpoint remains unchanged

---

### Requirement: Endpoint Normalization Integration

Endpoint auto-conversion **MUST** apply normalization (trailing slash removal, path suffix removal) as defined in the endpoint-normalization spec.

#### Scenario: Normalize before conversion

**Given** a region configuration

**When** the user enters OpenAI Endpoint "https://test.openai.azure.com/"

**Then** the system first normalizes it to "https://test.openai.azure.com"

**And** then generates Anthropic Endpoint "https://test.services.ai.azure.com/anthropic"

**And** both endpoints are stored in normalized form

#### Scenario: Normalize generated endpoint

**Given** a region configuration

**When** the user enters Anthropic Endpoint "https://test.services.ai.azure.com/anthropic/v1/messages/"

**Then** the system normalizes it to "https://test.services.ai.azure.com/anthropic"

**And** generates OpenAI Endpoint "https://test.openai.azure.com"

---

### Requirement: Default Behavior

For new regions, endpoint fields **SHALL** default to empty with no override flags set.

#### Scenario: New region defaults

**Given** the user adds a new region to an account

**Then** openaiEndpoint is empty

**And** anthropicEndpoint is empty

**And** openaiEndpointManualOverride is false (or undefined)

**And** anthropicEndpointManualOverride is false (or undefined)

**When** the user enters either endpoint

**Then** auto-sync generates the other endpoint

---

### Requirement: Conversion Functions

The system SHALL provide conversion helpers that parse any supported endpoint into canonical identity and generate all endpoint forms from that identity.

#### Scenario: Parse and generate from AI Services endpoint

**Given** a conversion utility that accepts `https://sample-resource.cognitiveservices.azure.com`

**When** conversion runs

**Then** the utility MUST derive `resource = sample-resource`

**And** generate OpenAI, Foundry project, and Anthropic endpoints using that resource

#### Scenario: Default projectId strips trailing resource suffix

**Given** the user enters `https://bakarahmed24-2561-resource.openai.azure.com`

**When** the system generates Foundry project endpoint

**Then** it MUST use `bakarahmed24-2561` as the default `projectId`

**And** produce `https://bakarahmed24-2561-resource.services.ai.azure.com/api/projects/bakarahmed24-2561`

#### Scenario: Default projectId falls back to resource name when no suffix exists

**Given** the user enters `https://sample.cognitiveservices.azure.com`

**When** the system generates Foundry project endpoint

**Then** it MUST use `sample` as the default `projectId`

**And** produce `https://sample.services.ai.azure.com/api/projects/sample`

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

