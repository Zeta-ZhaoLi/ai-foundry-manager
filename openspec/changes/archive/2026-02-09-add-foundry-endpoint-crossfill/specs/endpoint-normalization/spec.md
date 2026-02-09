# endpoint-normalization Specification

## MODIFIED Requirements

### Requirement: OpenAI Endpoint Trailing Slash Removal

All supported Azure AI Foundry endpoint inputs MUST remove trailing slashes before storage and conversion.

#### Scenario: OpenAI endpoint trailing slash is removed

**Given** the user enters `https://sample-resource.openai.azure.com/`

**When** normalization is applied

**Then** the stored value MUST be `https://sample-resource.openai.azure.com`

#### Scenario: AI Services endpoint trailing slash is removed

**Given** the user enters `https://sample-resource.cognitiveservices.azure.com/`

**When** normalization is applied

**Then** the stored value MUST be `https://sample-resource.cognitiveservices.azure.com`

#### Scenario: Foundry project endpoint trailing slash is removed

**Given** the user enters `https://sample-resource.services.ai.azure.com/api/projects/sample-project/`

**When** normalization is applied

**Then** the stored value MUST be `https://sample-resource.services.ai.azure.com/api/projects/sample-project`

---

### Requirement: Anthropic Endpoint Path Suffix Removal

Anthropic Endpoint inputs MUST normalize to `/anthropic` base path and remove trailing slash.

#### Scenario: Anthropic endpoint with messages path

**Given** the user enters `https://sample-resource.services.ai.azure.com/anthropic/v1/messages/`

**When** normalization is applied

**Then** the stored value MUST be `https://sample-resource.services.ai.azure.com/anthropic`
