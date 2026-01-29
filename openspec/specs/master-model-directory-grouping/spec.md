# master-model-directory-grouping Specification

## Purpose
TBD - created by archiving change 2026-01-29-remove-server-login-and-reshape-master-model-groups. Update Purpose after archive.
## Requirements
### Requirement: Grouping by Blank Lines

The Global Model Directory MUST be parsed into ordered groups separated by one or more blank lines.

#### Scenario: Two blocks produce two groups

**Given** the Global Model Directory text is:

```text
gpt-4o
gpt-4o-mini

claude-3-5-sonnet
claude-3-opus
```

**When** the directory is parsed

**Then** the system MUST produce 2 groups

**And** group 1 MUST contain `gpt-4o`, `gpt-4o-mini`

**And** group 2 MUST contain `claude-3-5-sonnet`, `claude-3-opus`

---

### Requirement: Tokenization Inside a Group

Inside each group, model IDs MUST be parsed from tokens separated by commas and/or whitespace.

Additionally, the system MUST preserve the author's newline structure as a "line layout" for rendering purposes.

#### Scenario: Same group, different lines

**Given** the Global Model Directory text is:

```text
gpt-4o gpt-4o-mini
o1-mini
```

**When** the directory is parsed

**Then** the system MUST treat both lines as belonging to the same group

**And** the region model picker MUST render two line rows inside that group

---

### Requirement: Preserve Manual Ordering

The system MUST preserve the manual order of models as entered in the Global Model Directory.

#### Scenario: No alphabetical sorting

**Given** the Global Model Directory text is:

```text
b-model
a-model
c-model
```

**When** the directory is parsed

**Then** the resulting ordered model list MUST be `b-model`, `a-model`, `c-model`

---

### Requirement: De-duplicate by First Appearance

If a model ID appears multiple times in the directory, it MUST be included only once, using its first appearance position.

#### Scenario: Duplicate in later group is ignored

**Given** the Global Model Directory text is:

```text
gpt-4o

gpt-4o
gpt-4o-mini
```

**When** the directory is parsed

**Then** the flattened ordered model list MUST contain `gpt-4o` only once

**And** `gpt-4o` MUST belong to the first group

---

### Requirement: Deprecate Fixed (standard/Sora/Claude) Categories

The product MUST NOT classify models into fixed categories based on ID prefixes (standard/Sora/Claude). Grouping MUST come exclusively from Global Model Directory blank-line blocks.

#### Scenario: Picker does not show legacy categories

**Given** the region model picker is rendered with a non-empty model list

**When** the user views the grouping UI

**Then** the UI MUST NOT show sections labeled "Standard Models", "Sora Series", or "Claude Series"

**And** the UI MUST show groups that correspond to the directory-defined groups

### Requirement: Grouped Rendering in the Directory Panel

The directory panel MUST render groups as separate sections.

Within each group, the directory panel SHOULD render models by line to reflect the authored layout.

#### Scenario: Directory panel shows line rows

**Given** the directory contains a group with multiple non-empty lines

**When** the user expands the Global Model Directory panel

**Then** the UI SHOULD show separate rows for each directory line inside the group

---

### Requirement: Group-Aware Region Model Picker

The region model picker MUST render selectable models grouped by the directory-defined groups.

Within a group, the picker MUST render models in line rows matching the directory's line layout.

#### Scenario: Picker renders by line

**Given** the Global Model Directory group contains two non-empty lines

**When** the user opens the region model picker

**Then** the models MUST be displayed in two separate rows within the same group section

