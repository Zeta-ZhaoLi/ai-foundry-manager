# localstorage-key-migration

## MODIFIED Requirements

### Requirement: Language Storage Key Update

The language preference migration MUST preserve the selected language across all supported languages.

#### Scenario: Existing users have language preference migrated

**Given** a user has existing data under key `azure-openai-manager:lang`

**And** no data exists under key `ai-foundry-manager:lang`

**When** the application initializes i18n

**Then** the application SHALL copy language preference from old key to new key

**And** the application SHALL preserve the selected language when it is one of the supported languages (`zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`)

**And** the application SHALL fall back to a supported default if the stored value is not supported
