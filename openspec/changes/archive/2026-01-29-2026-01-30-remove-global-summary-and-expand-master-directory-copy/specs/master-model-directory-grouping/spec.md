# Remove Global Summary Grouping Requirement

## REMOVED Requirements

### Requirement: Global Summary Reflects Groups and Lines

The Global Summary MUST render used models grouped by the directory-defined groups.

Within a group, the Global Summary SHOULD render models by line to match the directory layout.

#### Scenario: Summary follows directory layout

**Given** the Global Model Directory defines multiple groups using blank lines

**And** the user has selected models across those groups

**When** the Global Summary is rendered

**Then** the summary MUST show group sections in directory order

**And** within each shown group the summary SHOULD render separate line rows

## MODIFIED Requirements

### Requirement: Deprecate Fixed (standard/Sora/Claude) Categories

The product MUST NOT classify models into fixed categories based on ID prefixes (standard/Sora/Claude). Grouping MUST come exclusively from Global Model Directory blank-line blocks.

#### Scenario: Picker does not show legacy categories

**Given** the region model picker is rendered with a non-empty model list

**When** the user views the grouping UI

**Then** the UI MUST NOT show sections labeled "Standard Models", "Sora Series", or "Claude Series"

**And** the UI MUST show groups that correspond to the directory-defined groups
