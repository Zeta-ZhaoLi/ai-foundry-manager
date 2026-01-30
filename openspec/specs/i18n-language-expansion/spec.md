# i18n-language-expansion Specification

## Purpose
TBD - created by archiving change 2026-01-30-expand-localization-fix-theme-modes-add-header-github-link. Update Purpose after archive.
## Requirements
### Requirement: Support Additional UI Languages

The application MUST support selecting the following UI languages:

- `zh`
- `en`
- `ja`
- `fr`
- `de`
- `es`
- `pt-BR`
- `ko`

#### Scenario: Language options are available

**Given** the user opens the application

**When** the language selector is opened

**Then** the UI MUST present options for `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, and `ko`

---

### Requirement: Language Selection Persistence

The application MUST persist the selected UI language to localStorage key `ai-foundry-manager:lang`.

#### Scenario: Selected language persists across reload

**Given** the user selects language `ja`

**When** the user reloads the page

**Then** the application MUST initialize in language `ja`

---

### Requirement: Safe Fallback for Unknown Stored Language

If localStorage contains an unsupported language code, the application MUST fall back to a supported default.

#### Scenario: Unknown language falls back

**Given** localStorage key `ai-foundry-manager:lang` is set to `xx`

**When** the application initializes i18n

**Then** the application MUST fall back to a supported language

---

### Requirement: Locale Keyset Completeness

All supported locale files MUST contain the full translation keyset.

#### Scenario: Locale JSON files contain all keys

**Given** the repository contains locale files for `zh`, `en`, `ja`, `fr`, and `de`

**When** the test suite validates locale completeness

**Then** the test MUST fail if any locale is missing any translation key path present in the canonical keyset

