# Model Search Filters Accounts

## ADDED Requirements

### Requirement: Account List Filtering Based on Model Search

The model search input in the Azure Account Configuration section SHALL filter the displayed account list to show only accounts that contain regions with matching models.

**Files:**
- `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx`

**Dependencies:**
- `parseModels` utility from `src/utils/common.ts`

#### Scenario: Empty search shows all accounts

**Given** the user has multiple accounts configured
**When** the model search input is empty
**Then** all accounts SHALL be displayed in the account list

#### Scenario: Search filters accounts with matching models

**Given** the user has accounts with various models
**And** account "Account A" has region with models "gpt-4o, gpt-4o-mini"
**And** account "Account B" has region with models "claude-3-opus"
**When** the user enters "gpt-4o" in model search
**Then** only "Account A" SHALL be displayed
**And** "Account B" SHALL be hidden

#### Scenario: Partial match includes accounts

**Given** account "Account A" has region with model "gpt-4o"
**And** account "Account B" has region with model "gpt-35-turbo"
**When** the user enters "gpt" in model search
**Then** both "Account A" and "Account B" SHALL be displayed

#### Scenario: No match shows empty list

**Given** the user has accounts with various models
**When** the user enters "xyz123" in model search
**And** no models contain "xyz123"
**Then** no accounts SHALL be displayed

#### Scenario: Match in any region shows account

**Given** account "Account A" has two regions
**And** region 1 has models "claude-3-opus"
**And** region 2 has models "gpt-4o"
**When** the user enters "gpt-4o" in model search
**Then** "Account A" SHALL be displayed
**Because** at least one region contains matching model

#### Scenario: Disabled regions included in search

**Given** account "Account A" has region with models "gpt-4o"
**And** the region is disabled
**When** the user enters "gpt-4o" in model search
**Then** "Account A" SHALL be displayed
**Because** disabled regions are included in search logic

#### Scenario: Case-insensitive search

**Given** account "Account A" has region with model "GPT-4o"
**When** the user enters "gpt-4o" in model search
**Then** "Account A" SHALL be displayed
**Because** search is case-insensitive

### Requirement: Performance Optimization

The account filtering logic SHALL use React's `useMemo` hook to avoid unnecessary recalculations.

#### Scenario: Recalculation on dependency change

**Given** the account list and model search input
**When** either `sortedAccounts` or `modelFilterInput` changes
**Then** the filtered accounts SHALL be recalculated
**And** recalculation SHALL be skipped if neither dependency changed
