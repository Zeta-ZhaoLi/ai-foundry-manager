# azure-deployment-code-export Specification

## ADDED Requirements

### Requirement: Account-Level Resource Name Input Placement

The deployment `Resource Name` input MUST remain account-scoped and MUST be shown in account information immediately after quota fields.

#### Scenario: Resource name displayed in account info

**Given** the user opens an account card

**When** account info fields are rendered

**Then** a `Resource Name` input MUST be visible in account information

**And** it MUST be positioned after quota-related fields

**And** region-level deployment sections MUST NOT require separate `resourceName` input

#### Scenario: Region deployment uses account resource name

**Given** an account has `Resource Name` configured

**When** a region under that account exports deployment code

**Then** the exported template `resourceName` MUST use the account-level `Resource Name`
