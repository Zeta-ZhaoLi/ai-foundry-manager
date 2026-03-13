## MODIFIED Requirements

### Requirement: Exported Deployment Code Creates Foundry Project

Copied deployment code MUST create the Foundry project required by the region's Foundry project endpoint, not just the Azure AI account and model deployments.

#### Scenario: Copied template includes Foundry project creation

**Given** a region has a valid deployment `Resource Name`

**And** the region has one or more enabled deployment rows with valid model settings

**When** the user clicks "Copy Deployment Code"

**Then** the copied template MUST include a Foundry project resource derived from the region's effective project identity

**And** that project resource MUST depend on the Azure AI account resource in the same template

**And** the exported model deployment wrapper resource MUST depend on the Foundry project resource

**And** the template contract MUST enforce project creation before model deployment execution rather than relying only on resource array order
