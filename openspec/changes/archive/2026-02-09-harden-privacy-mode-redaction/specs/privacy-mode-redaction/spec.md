# privacy-mode-redaction Specification

## ADDED Requirements

### Requirement: Resource Name Is Privacy-Sensitive

`Resource Name` MUST be treated as sensitive information in privacy mode.

#### Scenario: Account resource name is masked

**Given** an account has deployment `resourceName` value `my-aoai-prod`

**And** privacy mode is enabled

**When** the account info section is rendered

**Then** the `Resource Name` field MUST display a masked value

**And** the actual `resourceName` MUST NOT be visible on screen

---

### Requirement: Sensitive Field Interaction Lockdown

When privacy mode is enabled, sensitive reveal and copy interactions MUST NOT expose secrets.

#### Scenario: API key reveal/copy is blocked

**Given** a region has a stored API key

**And** privacy mode is enabled

**When** the region configuration is rendered

**Then** API key reveal controls MUST be hidden or disabled

**And** API key copy controls MUST be hidden or disabled

#### Scenario: Endpoint copy is blocked in privacy mode

**Given** a region has endpoint values

**And** privacy mode is enabled

**When** endpoint fields are rendered

**Then** endpoint values MUST be masked

**And** endpoint copy controls MUST be hidden or disabled

---

### Requirement: Privacy Redaction Consistency

Privacy mode MUST apply a consistent masking policy across account and dashboard views for all defined sensitive fields.

#### Scenario: Sensitive account identifiers stay masked

**Given** privacy mode is enabled

**When** account list and account configuration are shown

**Then** sensitive account identifiers and notes MUST be masked

**And** masking style MUST be consistent with existing privacy display conventions

#### Scenario: Financial sensitive values remain masked

**Given** privacy mode is enabled

**When** account overview/summary tables are rendered

**Then** purchase, used, and cost fields MUST display masked placeholders instead of actual values
