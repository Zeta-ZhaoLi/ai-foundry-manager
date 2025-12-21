# Account ID Prefix - Position-Based Assignment and Re-numbering

## MODIFIED Requirements

### Requirement: Account IDs Must Reflect Current Sort Order

Account IDs **MUST** be assigned based on the account's position in the sorted accounts array, not by finding the lowest available gap. Premium accounts receive A001, A002, A003... in their current order, and standard accounts receive B001, B002, B003... in their current order.

**Rationale:** Users expect account IDs to match the visual order after sorting or drag-and-drop reordering. Gap-filling logic creates confusing sequences (A001, A003, A002) that don't reflect actual positions.

#### Scenario: Assign IDs Based on Array Position

**Given** 3 premium accounts in positions 0, 1, 2
**When** IDs are assigned or re-numbered
**Then** they **MUST** receive A001, A002, A003 respectively
**And** the IDs **MUST** match their visual order in the list

#### Scenario: Re-number After Drag-and-Drop Reorder

**Given** 3 standard accounts with IDs B001, B002, B003
**And** user drags B003 to the first position (new order: B003, B001, B002)
**When** user clicks the re-number button
**Then** the accounts **MUST** be renumbered to B001, B002, B003 based on new positions

#### Scenario: Re-number After Deletion

**Given** 5 standard accounts B001, B002, B003, B004, B005
**And** user deletes B002 and B004
**When** user clicks the re-number button
**Then** remaining accounts **MUST** be renumbered to B001, B002, B003 sequentially

## ADDED Requirements

### Requirement: Manual Re-numbering Must Be User-Triggered

The system **MUST** provide a manual re-number button that allows users to reassign all account IDs based on current sort order. Re-numbering **MUST** require explicit user confirmation via dialog.

**Rationale:** Automatic re-numbering on every reorder would be disruptive. Users need control over when IDs are reassigned to avoid confusion during complex reordering operations.

#### Scenario: Re-number Button Triggers Confirmation

**Given** user clicks the "重新编号" (Re-number) button
**Then** a confirmation dialog **MUST** appear
**And** the dialog **MUST** warn that IDs will be reassigned based on current order

#### Scenario: Confirm Re-numbering Executes Assignment

**Given** the re-number confirmation dialog is open
**When** user clicks "确认" (Confirm)
**Then** all premium accounts **MUST** be renumbered A001, A002, A003... in current order
**And** all standard accounts **MUST** be renumbered B001, B002, B003... in current order
**And** a success notification **MUST** be displayed

#### Scenario: Cancel Re-numbering Preserves Existing IDs

**Given** the re-number confirmation dialog is open
**When** user clicks "取消" (Cancel)
**Then** no account IDs **MUST** be changed
**And** the dialog **MUST** close without action

### Requirement: Config Import Must Restore Account IDs Correctly

When importing a configuration file, the system **MUST** restore account IDs exactly as exported, preserving the ID-to-account mapping.

**Rationale:** Users expect exported and imported configurations to be identical, including account IDs used for external references.

#### Scenario: Import Preserves Account IDs

**Given** a configuration export with accounts A001, A002, B001, B002
**When** user imports this configuration
**Then** the imported accounts **MUST** have IDs A001, A002, B001, B002
**And** each ID **MUST** map to the same account data as in the export

#### Scenario: Import Validates Config Structure

**Given** user selects an invalid JSON file for import
**When** the import process runs
**Then** the system **MUST** detect the invalid structure
**And** **MUST** show an error message
**And** **MUST NOT** modify existing account data

#### Scenario: Import Decrypts Sensitive Fields

**Given** an exported config with encrypted API keys and passwords
**When** user imports this configuration
**Then** the system **MUST** decrypt all sensitive fields
**And** the decrypted data **MUST** match the original pre-export values
