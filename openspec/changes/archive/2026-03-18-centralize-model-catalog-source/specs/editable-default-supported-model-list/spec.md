# editable-default-supported-model-list

## ADDED Requirements

### Requirement: Dedicated Editable Default Model List File

The repository MUST provide a dedicated manually editable file for this project's default supported model list.

That file MUST be separate from application logic files so maintainers can update the default list without editing TypeScript source.

#### Scenario: Maintainer updates default supported models

**Given** a maintainer wants to add, remove, or reorder the project's default supported models

**When** they look for the canonical source of that default list

**Then** there MUST be one dedicated file intended for manual edits

**And** that file MUST be separate from `Azure-AI-Founryd-Deployment-Template.json`

---

### Requirement: Separate File Preserves Authored Formatting

The dedicated default model list file MUST preserve the authored formatting needed by the existing Global Model Directory behavior, including blank lines, commas, empty tokens, and trailing newline behavior when present.

#### Scenario: Formatting-sensitive default list survives extraction

**Given** the dedicated default model list file contains blank-line-separated groups and comma-delimited entries

**When** the application loads the default seed text from that file

**Then** the loaded text MUST match the file contents verbatim
