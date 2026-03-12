## MODIFIED Requirements

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
