# azure-deployment-code-export Specification

## MODIFIED Requirements

### Requirement: DeploymentName Model Integrity

Deployment rows MUST prevent model identity drift via `deploymentName` edits.

#### Scenario: DeploymentName cannot switch modelName

**Given** a row with fixed `modelName`

**And** `deploymentName` matches a template entry whose `modelName` differs from the row `modelName` (case-insensitive comparison)

**When** the user attempts copy/export

**Then** the system MUST block copy/export with an actionable validation error

**And** MUST NOT mutate row `modelName`

#### Scenario: DeploymentName includes modelName case-insensitively

**Given** a deployment row has fixed `modelName = "DeepSeek-V3.2"`

**When** the row `deploymentName = "deepseek-v3.2-251201"`

**Then** the system MUST treat the row as valid for this rule

**And** MUST NOT fail only because of case differences

#### Scenario: Template-defined deployment/model combination is allowed

**Given** template contains an entry with `deploymentName = "deepseek-v3.2-251201"` and `modelName = "DeepSeek-V3.2"`

**And** a row uses the same `deploymentName`

**And** row `modelName` is the same model identity (case-insensitive)

**When** the user attempts copy/export

**Then** the system MUST allow this row for deployment validation
