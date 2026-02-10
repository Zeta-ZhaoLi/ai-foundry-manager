# i18n-language-expansion Specification

## MODIFIED Requirements

### Requirement: Locale Keyset Completeness

All supported locale files MUST contain the full translation keyset used by the UI.

#### Scenario: Locale JSON files contain all keys for supported languages

**Given** the repository contains locale files for `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, and `ko`

**When** the test suite validates locale completeness

**Then** the test MUST fail if any locale is missing any translation key path present in the canonical keyset

---

## ADDED Requirements

### Requirement: Core Workflow Labels Use Localization Keys

User-facing labels in core workflows MUST use localization keys instead of hardcoded text.

#### Scenario: Model deployment table labels are localized

**Given** a user opens the model deployment table in account/region configuration

**When** column headers and action labels are rendered

**Then** labels for join/select action, `model`, `deploymentName`, `version`, and `capacity` MUST be rendered from i18n locale keys

**And** they MUST display translated values according to the currently selected language

#### Scenario: Localization audit catches similar hardcoded labels

**Given** implementation includes a localization audit pass for user-facing strings

**When** a hardcoded label is found in core UI sections

**Then** that label MUST be replaced with an i18n key

**And** missing keys MUST be added to all supported locale files
