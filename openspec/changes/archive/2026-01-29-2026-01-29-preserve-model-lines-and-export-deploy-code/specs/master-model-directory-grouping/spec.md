# Line-Preserving Group Rendering

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Global Summary Reflects Groups and Lines

The Global Summary MUST render used models grouped by the directory-defined groups.

Within a group, the Global Summary SHOULD render models by line to match the directory layout.

#### Scenario: Summary follows directory layout

**Given** the Global Model Directory defines multiple groups using blank lines

**And** the user has selected models across those groups

**When** the Global Summary is rendered

**Then** the summary MUST show group sections in directory order

**And** within each shown group the summary SHOULD render separate line rows
