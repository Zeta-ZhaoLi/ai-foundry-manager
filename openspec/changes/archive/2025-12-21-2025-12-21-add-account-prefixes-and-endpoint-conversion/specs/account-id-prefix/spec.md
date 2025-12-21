# account-id-prefix Specification

## Purpose

Provide automatic tier-based account ID prefixes (A-series for premium, B-series for standard) to help users systematically identify and organize Azure accounts. Account IDs are automatically assigned and managed by the system.

## ADDED Requirements

### Requirement: Automatic ID Assignment on Account Creation

New accounts **MUST** automatically receive a unique account ID based on their tier.

#### Scenario: Create new premium account

**Given** the user creates a new account with tier "premium"

**And** existing premium accounts have IDs: A001, A002

**When** the new account is created

**Then** the system assigns ID "A003" automatically

#### Scenario: Create new standard account

**Given** the user creates a new account with tier "standard"

**And** existing standard accounts have IDs: B001, B003

**When** the new account is created

**Then** the system assigns ID "B002" (reusing deleted B002's slot)

#### Scenario: First account of each tier

**Given** no accounts exist yet

**When** the user creates the first premium account

**Then** the system assigns ID "A001"

**When** the user then creates the first standard account

**Then** the system assigns ID "B001"

---

### Requirement: ID Reassignment on Tier Change

Changing an account's tier **MUST** trigger ID reassignment to match the new tier's prefix.

#### Scenario: Change from premium to standard

**Given** an account with ID "A003" and tier "premium"

**And** existing standard accounts have IDs: B001, B002

**When** the user changes the account tier to "standard"

**Then** the system reassigns the account ID to "B003"

**And** the ID "A003" becomes available for future premium accounts

#### Scenario: Change from standard to premium

**Given** an account with ID "B005" and tier "standard"

**And** existing premium accounts have IDs: A001, A002, A003

**When** the user changes the account tier to "premium"

**Then** the system reassigns the account ID to "A004"

**And** the ID "B005" becomes available for future standard accounts

---

### Requirement: ID Reuse After Deletion

Deleted account IDs **MUST** be reused by new accounts of the same tier.

#### Scenario: Reuse deleted ID

**Given** existing premium accounts with IDs: A001, A003

**And** A002 was previously deleted

**When** the user creates a new premium account

**Then** the system assigns ID "A002" (filling the gap)

#### Scenario: Sequential after no gaps

**Given** existing premium accounts with IDs: A001, A002, A003

**When** the user creates a new premium account

**Then** the system assigns ID "A004" (next sequential number)

---

### Requirement: ID Format Consistency

Account IDs **MUST** follow a consistent format: `{PREFIX}{NUMBER}` where PREFIX is A or B, and NUMBER is zero-padded to 3 digits.

#### Scenario: ID format validation

**Given** an account with tier "premium"

**When** the system assigns an account ID

**Then** the ID format matches the pattern `A\d{3}` (e.g., A001, A099)

**And** the numeric part is zero-padded (e.g., A001 not A1)

#### Scenario: Standard tier format

**Given** an account with tier "standard"

**When** the system assigns an account ID

**Then** the ID format matches the pattern `B\d{3}` (e.g., B001, B099)

---

### Requirement: Account ID Display

Account IDs **MUST** be displayed as read-only badges in the UI, positioned next to the tier selector.

#### Scenario: Display premium account ID

**Given** an account with ID "A005" and tier "premium"

**When** the user views the account card

**Then** the UI displays a badge showing "A005"

**And** the badge uses a gold/yellow color scheme

**And** the badge is not editable (read-only)

#### Scenario: Display standard account ID

**Given** an account with ID "B012" and tier "standard"

**When** the user views the account card

**Then** the UI displays a badge showing "B012"

**And** the badge uses a silver/gray color scheme

**And** the badge is not editable (read-only)

---

### Requirement: Migration for Existing Accounts

Existing accounts without account IDs **MUST** be automatically assigned IDs on first load after the update.

#### Scenario: Migrate existing accounts

**Given** localStorage contains accounts without accountId field

**And** the accounts have tiers: premium, standard, premium

**When** the application loads the accounts

**Then** the system automatically assigns IDs: A001, B001, A002

**And** the assignments are saved back to localStorage

#### Scenario: Preserve existing IDs

**Given** localStorage contains accounts with valid accountId fields

**When** the application loads the accounts

**Then** the system preserves all existing IDs

**And** no reassignment occurs

---

### Requirement: Uniqueness Guarantee

The system **MUST** ensure that no two accounts have the same account ID at any time.

#### Scenario: Prevent duplicate IDs

**Given** existing accounts with IDs: A001, A002, B001

**When** the system generates a new ID for any tier

**Then** the new ID does not conflict with any existing ID

**And** ID generation checks all accounts across both tiers

#### Scenario: Concurrent creation

**Given** the user is creating multiple accounts rapidly

**When** multiple accounts are created in quick succession

**Then** each account receives a unique ID

**And** no ID conflicts occur

---

### Requirement: ID Persistence

Account IDs **MUST** be persisted in localStorage alongside other account data.

#### Scenario: Save and load account ID

**Given** an account with ID "A007"

**When** the user modifies the account name

**And** the account is saved to localStorage

**Then** the account ID "A007" is also saved

**When** the page is refreshed

**Then** the account still has ID "A007"

#### Scenario: Export and import with IDs

**Given** an account with ID "B003"

**When** the user exports the configuration to JSON

**Then** the exported JSON includes the accountId field

**When** the user imports the configuration on another device

**Then** the imported account retains ID "B003"
