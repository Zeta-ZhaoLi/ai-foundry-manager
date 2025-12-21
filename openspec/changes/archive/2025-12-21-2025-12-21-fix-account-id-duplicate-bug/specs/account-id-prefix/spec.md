# Account ID Prefix - Migration Fix

## MODIFIED Requirements

### Requirement: Migration Function Must Track Assigned IDs

The migration function **MUST** maintain an accumulator of accounts with newly assigned IDs during iteration, ensuring each subsequent account sees all previously assigned IDs when generating its own ID.

**Rationale:** Using `Array.map()` processes each element independently without seeing mutations from previous iterations, causing duplicate ID assignment. An accumulator pattern ensures uniqueness.

#### Scenario: Migrate Multiple Standard Accounts Without IDs

**Given** 5 existing standard accounts without accountId fields
**When** the migration function runs
**Then** they **MUST** receive sequential unique IDs: B001, B002, B003, B004, B005
**And** no duplicate IDs are assigned

#### Scenario: Migrate Mixed Tiers Without IDs

**Given** 2 premium accounts and 3 standard accounts without accountId fields
**When** the migration function runs
**Then** premium accounts **MUST** receive A001, A002
**And** standard accounts **MUST** receive B001, B002, B003
**And** no duplicates exist across tiers

#### Scenario: Preserve Existing Account IDs During Migration

**Given** 3 accounts where 2 already have accountId and 1 does not
**When** the migration function runs
**Then** accounts with existing IDs **MUST** keep their IDs unchanged
**And** only the account without an ID **MUST** receive a new sequential ID

### Requirement: ID Generation Must Consider Previously Migrated Accounts

When calling `generateAccountId()` during migration, the function **MUST** receive the accumulated array of accounts including all previously assigned IDs in the current migration batch.

**Rationale:** Passing the original unchanged accounts array causes the generator to see the same state on every iteration, leading to duplicate assignments.

#### Scenario: Generate ID Sees Previous Assignments

**Given** the migration is processing the 3rd standard account
**And** the previous 2 accounts have been assigned B001 and B002
**When** `generateAccountId()` is called for the 3rd account
**Then** the accounts array passed **MUST** include the 2 accounts with B001 and B002
**And** the function **MUST** return B003 (not B001 or B002)
