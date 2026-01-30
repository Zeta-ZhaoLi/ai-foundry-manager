# default-master-model-directory-seed Specification

## Purpose
TBD - created by archiving change 2026-01-30-seed-default-master-model-directory. Update Purpose after archive.
## Requirements
### Requirement: Seed Default Master Directory on Fresh Install

When `ai-foundry-manager:master-models` is missing from localStorage, and no legacy value is migrated, the application MUST initialize the Global Model Directory text to the canonical default seed text.

#### Scenario: Fresh install seeds default directory

**Given** localStorage does not contain key `ai-foundry-manager:master-models`

**And** localStorage does not contain key `azure-openai-manager:master-models`

**When** the application initializes

**Then** the Global Model Directory text MUST equal the canonical default seed text

---

### Requirement: Do Not Overwrite Existing Directory Text

If localStorage contains key `ai-foundry-manager:master-models`, the application MUST NOT overwrite it during initialization, even if the stored value is an empty string.

#### Scenario: User-cleared directory remains empty

**Given** localStorage key `ai-foundry-manager:master-models` exists and is an empty string

**When** the application initializes

**Then** the Global Model Directory text MUST remain an empty string

---

### Requirement: Preserve Formatting Exactly

The canonical default seed text MUST be applied verbatim, preserving:

- blank lines (group separators)
- commas (including trailing commas)
- empty tokens represented by `,,`

#### Scenario: Default seed preserves blank lines and commas

**Given** the application is in the fresh-install state

**When** the Global Model Directory text is read

**Then** the text MUST contain the same blank lines and comma placement as the canonical default seed text

