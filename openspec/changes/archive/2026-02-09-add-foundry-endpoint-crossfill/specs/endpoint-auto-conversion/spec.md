# endpoint-auto-conversion Specification

## MODIFIED Requirements

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

### Requirement: Conversion Functions

The system SHALL provide conversion helpers that parse any supported endpoint into canonical identity and generate all endpoint forms from that identity.

#### Scenario: Parse and generate from AI Services endpoint

**Given** a conversion utility that accepts `https://sample-resource.cognitiveservices.azure.com`

**When** conversion runs

**Then** the utility MUST derive `resource = sample-resource`

**And** generate OpenAI, Foundry project, and Anthropic endpoints using that resource

#### Scenario: Default projectId derivation

**Given** the user enters `https://sample-resource.openai.azure.com`

**When** the system generates Foundry project endpoint

**Then** it MUST use `sample-resource` as the default `projectId`

**And** produce `https://sample-resource.services.ai.azure.com/api/projects/sample-resource`

---

## REMOVED Requirements

### Requirement: Manual Override Detection

### Requirement: Override Reset on Clear

### Requirement: Visual Indicators

### Requirement: Bidirectional Independence

### Requirement: Persistence of Override Flags
