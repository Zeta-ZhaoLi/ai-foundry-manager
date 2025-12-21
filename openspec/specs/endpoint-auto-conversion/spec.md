# endpoint-auto-conversion Specification

## Purpose
TBD - created by archiving change 2025-12-21-add-account-prefixes-and-endpoint-conversion. Update Purpose after archive.
## Requirements
### Requirement: OpenAI to Anthropic Auto-Generation

When a user inputs an OpenAI Endpoint, the system **SHALL** automatically generate the corresponding Anthropic Endpoint if the target field is empty or not manually overridden.

#### Scenario: Auto-generate Anthropic from OpenAI

**Given** a region configuration with empty endpoints

**When** the user enters OpenAI Endpoint "https://test-resource.openai.azure.com"

**Then** the system automatically generates Anthropic Endpoint "https://test-resource.services.ai.azure.com/anthropic"

**And** the Anthropic Endpoint field is populated

**And** a sync indicator (🔄) is displayed next to the Anthropic Endpoint

#### Scenario: OpenAI endpoint with trailing slash

**Given** a region configuration with empty endpoints

**When** the user enters OpenAI Endpoint "https://test-resource.openai.azure.com/"

**Then** the system normalizes it to "https://test-resource.openai.azure.com"

**And** generates Anthropic Endpoint "https://test-resource.services.ai.azure.com/anthropic"

#### Scenario: Update OpenAI updates Anthropic

**Given** a region with:
- OpenAI Endpoint: "https://old-resource.openai.azure.com"
- Anthropic Endpoint: "https://old-resource.services.ai.azure.com/anthropic" (auto-generated)

**When** the user changes OpenAI Endpoint to "https://new-resource.openai.azure.com"

**Then** the system updates Anthropic Endpoint to "https://new-resource.services.ai.azure.com/anthropic"

**And** the sync indicator (🔄) remains on the Anthropic Endpoint

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

### Requirement: Manual Override Detection

When a user manually edits an auto-generated endpoint, the system **MUST** set an override flag to prevent future automatic updates to that field.

#### Scenario: Manual edit sets override flag

**Given** a region with:
- OpenAI Endpoint: "https://test.openai.azure.com"
- Anthropic Endpoint: "https://test.services.ai.azure.com/anthropic" (auto-generated)

**When** the user manually changes Anthropic Endpoint to "https://custom.services.ai.azure.com/anthropic"

**Then** the system sets anthropicEndpointManualOverride flag to true

**And** the sync indicator (🔄) changes to override indicator (✏️)

#### Scenario: Override prevents auto-sync

**Given** a region with:
- OpenAI Endpoint: "https://test.openai.azure.com"
- Anthropic Endpoint: "https://custom.services.ai.azure.com/anthropic" (manually overridden)
- anthropicEndpointManualOverride: true

**When** the user changes OpenAI Endpoint to "https://new.openai.azure.com"

**Then** the Anthropic Endpoint remains "https://custom.services.ai.azure.com/anthropic"

**And** the override indicator (✏️) is still displayed

---

### Requirement: Override Reset on Clear

When a user clears a manually overridden endpoint, the system **SHALL** reset the override flag and resume auto-sync.

#### Scenario: Clear overridden field

**Given** a region with:
- OpenAI Endpoint: "https://test.openai.azure.com"
- Anthropic Endpoint: "https://custom.services.ai.azure.com/anthropic" (manually overridden)
- anthropicEndpointManualOverride: true

**When** the user clears the Anthropic Endpoint (makes it empty)

**Then** the system sets anthropicEndpointManualOverride flag to false

**And** auto-generates Anthropic Endpoint from OpenAI Endpoint

**And** the sync indicator (🔄) is displayed

#### Scenario: Clearing source endpoint clears generated target

**Given** a region with:
- OpenAI Endpoint: "https://test.openai.azure.com"
- Anthropic Endpoint: "https://test.services.ai.azure.com/anthropic" (auto-generated)

**When** the user clears the OpenAI Endpoint

**Then** the Anthropic Endpoint is not automatically cleared (preserves user's data)

**And** the sync indicator (🔄) remains (will sync when OpenAI is re-entered)

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

### Requirement: Visual Indicators

The system **MUST** display clear visual indicators to show whether an endpoint is auto-synced or manually overridden.

#### Scenario: Auto-sync indicator

**Given** a region with auto-generated Anthropic Endpoint

**When** the user views the region configuration

**Then** a sync icon (🔄) is displayed next to the Anthropic Endpoint field

**And** hovering shows tooltip: "Auto-synced from OpenAI Endpoint"

#### Scenario: Manual override indicator

**Given** a region with manually overridden Anthropic Endpoint

**When** the user views the region configuration

**Then** an edit icon (✏️) is displayed next to the Anthropic Endpoint field

**And** hovering shows tooltip: "Manually edited - auto-sync disabled"

#### Scenario: No indicator for manual entry

**Given** a region where both endpoints were manually entered (no auto-sync occurred)

**When** the user views the region configuration

**Then** no special indicator is displayed

**And** both fields appear as normal input fields

---

### Requirement: Bidirectional Independence

OpenAI to Anthropic sync and Anthropic to OpenAI sync **MUST** operate independently with separate override flags.

#### Scenario: Override one direction only

**Given** a region with:
- OpenAI Endpoint: "https://test.openai.azure.com" (manually entered)
- Anthropic Endpoint: "https://test.services.ai.azure.com/anthropic" (auto-generated from OpenAI)

**When** the user manually edits OpenAI Endpoint to "https://new.openai.azure.com"

**Then** the Anthropic Endpoint updates to "https://new.services.ai.azure.com/anthropic"

**And** only openaiEndpointManualOverride remains false (still allows auto-generation of OpenAI from Anthropic changes)

**When** the user then manually edits Anthropic Endpoint

**Then** anthropicEndpointManualOverride is set to true

**And** future OpenAI changes won't update Anthropic

**And** but Anthropic changes can still update OpenAI

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

### Requirement: Persistence of Override Flags

Override flags **MUST** be persisted in localStorage alongside endpoint values.

#### Scenario: Save override flag

**Given** a region with anthropicEndpointManualOverride set to true

**When** the configuration is saved to localStorage

**Then** the override flag is included in the saved data

**When** the page is refreshed

**Then** the override flag is restored

**And** auto-sync behavior is correctly disabled for that field

#### Scenario: Export and import override flags

**Given** a region with override flags set

**When** the user exports the configuration to JSON

**Then** the exported JSON includes openaiEndpointManualOverride and anthropicEndpointManualOverride fields

**When** the configuration is imported

**Then** the override flags are restored

**And** auto-sync behavior matches the original state

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

The system **SHALL** implement utility functions for endpoint conversion.

#### Scenario: Convert OpenAI to Anthropic

**Given** a function `convertOpenAIToAnthropicEndpoint(openaiUrl: string): string | null`

**When** called with "https://test.openai.azure.com"

**Then** it returns "https://test.services.ai.azure.com/anthropic"

**When** called with invalid URL

**Then** it returns null

#### Scenario: Convert Anthropic to OpenAI

**Given** a function `convertAnthropicToOpenAIEndpoint(anthropicUrl: string): string | null`

**When** called with "https://test.services.ai.azure.com/anthropic"

**Then** it returns "https://test.openai.azure.com"

**When** called with invalid URL

**Then** it returns null

#### Scenario: Extract resource name

**Given** a function `extractAzureResourceName(endpoint: string): string | null`

**When** called with "https://baha-3340-resource.openai.azure.com"

**Then** it returns "baha-3340-resource"

**When** called with "https://baha-3340-resource.services.ai.azure.com/anthropic"

**Then** it returns "baha-3340-resource"

**When** called with non-Azure URL

**Then** it returns null

