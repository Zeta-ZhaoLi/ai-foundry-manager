# Azure Deployment Code Export

## ADDED Requirements

### Requirement: Region Deployment Code Output

The region deployment section MUST provide an action to copy the full deployment code.

"Full deployment code" MUST be a complete ARM template JSON derived from `mainTemplate.json`.

#### Scenario: Copy deployment code

**Given** a region has selected models with valid deployment rows

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST copy a complete ARM template JSON to the clipboard

---

### Requirement: Validation and Errors

If required inputs are missing, the system MUST not generate deployment code and MUST show an actionable error.

#### Scenario: Missing region resourceName

**Given** the region deployment config cannot determine a `resourceName`

**When** the user clicks "Copy Deployment Code"

**Then** the system MUST show an error indicating the missing `resourceName`

**And** MUST NOT copy any deployment code

---

### Requirement: Replace Portal-Based One-Click Deploy

The Portal-based one-click deploy workflow MUST be removed/replaced by the deployment code copy action.

#### Scenario: No Portal open on deploy

**Given** the region deployment section is available

**When** the user triggers deployment output

**Then** the system MUST NOT open Azure Portal automatically

**And** MUST NOT download files automatically

---

### Requirement: Copy Is One-Click

The deployment code export MUST be copyable via a single UI action.

#### Scenario: No manual select needed

**Given** the deployment code export UI is available

**When** the user clicks "Copy Deployment Code"

**Then** the clipboard MUST contain the full template JSON without requiring manual text selection
