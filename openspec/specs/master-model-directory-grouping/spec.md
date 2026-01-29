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

Inside each group, model IDs MUST be parsed from tokens separated by commas and/or whitespace (spaces, tabs, newlines).

#### Scenario: Mixed separators are accepted

**Given** the Global Model Directory text is:

```text
gpt-4o, gpt-4o-mini\n gpt-4.1\t o1-mini
```

**When** the directory is parsed

**Then** the system MUST produce a single group containing `gpt-4o`, `gpt-4o-mini`, `gpt-4.1`, `o1-mini` in that order

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

#### Scenario: Global summary does not show legacy categories

**Given** global summary is rendered with a non-empty model list

**When** the user views the grouping UI

**Then** the UI MUST NOT show sections labeled "Standard Models", "Sora Series", or "Claude Series"

**And** the UI MUST show groups that correspond to the directory-defined groups

---

### Requirement: Grouped Rendering in the Directory Panel

The directory panel MUST render the parsed groups as separate sections in the model list under the text area.

#### Scenario: Chips are grouped

**Given** the directory contains multiple groups

**When** the user expands the Global Model Directory panel

**Then** the chips/list under the textarea MUST render separate grouped sections

---

### Requirement: Group-Aware Region Model Picker

The region model picker MUST render selectable models grouped by the directory-defined groups.

#### Scenario: Select group selects all models in that directory group

**Given** a directory group contains models `m1` and `m2`

**When** the user clicks the "select this group" action for that group

**Then** the region selection MUST include `m1` and `m2`

