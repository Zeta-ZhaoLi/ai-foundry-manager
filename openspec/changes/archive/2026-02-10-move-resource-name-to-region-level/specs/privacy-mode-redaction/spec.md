# Privacy Mode Redaction

## MODIFIED Requirements

### Requirement: Resource Name Is Privacy-Sensitive

`Resource Name` MUST be treated as sensitive information in privacy mode.

#### Scenario: Region resource name is masked

**Given** a region has deployment `resourceName` value `my-aoai-prod`

**And** privacy mode is enabled

**When** the region configuration section is rendered

**Then** the region `Resource Name` field MUST display a masked value

**And** the actual `resourceName` MUST NOT be visible on screen

**And** editing controls for region `Resource Name` MUST be disabled
