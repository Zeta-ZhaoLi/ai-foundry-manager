# Azure Deployment Code Export

## ADDED Requirements

### Requirement: Deployment Selection Column Uses Select Label

In each region deployment table, the first column header for row inclusion MUST use localized `Select` wording instead of legacy include/join wording.

#### Scenario: Deployment header shows select wording

**Given** the user expands a region's deployment table

**When** the first column header is rendered

**Then** the header label MUST display localized `Select` semantics (for example, `选择` in `zh`, `Select` in `en`)

**And** the UI MUST NOT display legacy include/join wording for that header

---

### Requirement: Deployment Bulk Selection Uses Single Tri-State Checkbox

Each region deployment table MUST provide one header checkbox that cycles three bulk actions for row `enabled` state: select all, invert selection, and select none.

#### Scenario: Three clicks execute invert/all/none in order

**Given** a region deployment table has one or more rows

**And** the header tri-state checkbox is available

**When** the user clicks the header checkbox the first time in the cycle

**Then** each deployment row MUST toggle from its pre-click enabled state (`invert selection`)

**When** the user clicks the header checkbox the second time in the cycle

**Then** all deployment rows MUST become enabled (`select all`)

**When** the user clicks the header checkbox the third time in the cycle

**Then** all deployment rows MUST become disabled (`select none`)

#### Scenario: Bulk actions do not require extra action buttons or text labels

**Given** the user views a region deployment table

**When** bulk selection controls are rendered

**Then** select all, invert selection, and select none MUST be reachable through the single header checkbox cycle

**And** the deployment table MUST NOT add separate bulk-action buttons or text labels for these three actions
