# region-endpoint-bundle-generation Specification

## ADDED Requirements

### Requirement: Explicit Generation From Account Email

The system MUST provide an explicit region-level action that generates `resourceName` and all supported endpoint fields from the account email local-part.

#### Scenario: Generate region bundle from valid account email

**Given** an account has name `jessicabarrios060193@gmail.com`

**And** a region has empty `resourceName` and endpoint fields

**When** the user clicks the region auto-generate action

**Then** the system MUST derive the base seed `jessicabarrios060193`

**And** generate a region `resourceName` that starts with `jessicabarrios060193-`

**And** ends with `-resource`

**And** populate Foundry project, OpenAI, AI Services, and Anthropic endpoints from that generated `resourceName`

#### Scenario: Generation uses a region-scoped project identifier

**Given** an account has name `jessicabarrios060193@gmail.com`

**When** the user clicks the region auto-generate action

**Then** the system MUST generate Foundry project endpoint using the generated `resourceName` hostname

**And** the path segment after `/api/projects/` MUST be a generated project identifier derived from the same account email seed

### Requirement: Resource Name Length and Uniqueness

Generated `resourceName` values MUST stay within the requested length limit and MUST not duplicate another region resource name under the same account.

#### Scenario: Generated resourceName respects 32-character limit

**Given** a valid account email local-part is long enough to exceed the limit when combined with random digits and `-resource`

**When** the user clicks the region auto-generate action

**Then** the generated `resourceName` MUST be at most 32 characters

**And** it MUST still end with `-resource`

#### Scenario: Sibling regions receive different generated resource names

**Given** an account has multiple regions

**And** one region already has generated `resourceName = "sample-1234-resource"`

**When** the user generates values for another region under the same account

**Then** the new region MUST receive a different `resourceName`

### Requirement: Invalid Account Name Handling

Generation MUST reject account names that are not valid email addresses.

#### Scenario: Non-email account name blocks generation

**Given** an account has name `My Test Account`

**And** a region has empty `resourceName` and endpoint fields

**When** the user clicks the region auto-generate action

**Then** the system MUST show an actionable error indicating that the account name must be an email address

**And** the region `resourceName` and endpoint fields MUST remain unchanged

### Requirement: Manual Overwrite Protection

The generation action MUST NOT silently overwrite manual region values.

#### Scenario: Manual values require confirmation before overwrite

**Given** a region contains one or more manually entered values among `resourceName` and the four endpoint fields

**When** the user clicks the region auto-generate action

**Then** the system MUST require explicit confirmation before overwriting those values

**And** if the user cancels, the region values MUST remain unchanged

#### Scenario: Generated values remain manually editable

**Given** the system has generated region `resourceName` and endpoint values

**When** the user manually edits `resourceName`

**Then** the field MUST accept the manual value

**And** the system MUST treat that field as manually edited for subsequent overwrite decisions
