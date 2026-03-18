## MODIFIED Requirements

### Requirement: Seed Default Master Directory on Fresh Install

When `ai-foundry-manager:master-models` is missing from localStorage, and no legacy value is migrated, the application MUST initialize the Global Model Directory text to the canonical default seed text derived from the dedicated editable default model list file defined by `editable-default-supported-model-list`.

#### Scenario: Fresh install seeds default directory from editable default list file

**Given** localStorage does not contain key `ai-foundry-manager:master-models`

**And** localStorage does not contain key `azure-openai-manager:master-models`

**When** the application initializes

**Then** the Global Model Directory text MUST equal the canonical default seed text derived from the dedicated editable default model list file

---

### Requirement: Preserve Formatting Exactly

The canonical default seed text MUST be produced from the dedicated editable default model list file while preserving:

- blank lines (group separators)
- commas (including trailing commas)
- empty tokens represented by `,,` when explicitly authored by the file

#### Scenario: Editable default list file preserves blank lines and commas

**Given** the application is in the fresh-install state

**When** the Global Model Directory text is read

**Then** the text MUST contain the same blank lines and comma placement defined by the dedicated editable default model list file
