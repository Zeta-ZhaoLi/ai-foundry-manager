# Account Card Layout - Collapsed View Optimization

## MODIFIED Requirements

### Requirement: Account ID Must Be Visible in Collapsed State

The account ID badge **MUST** be positioned at the leftmost position in the collapsed account header, ensuring visibility without requiring expansion.

**Rationale:** Users need to quickly identify accounts by their ID (A001, B001, etc.) when scanning a collapsed list. The current position after the tier selector hides this critical identifier in collapsed state.

#### Scenario: Account ID Visible When Collapsed

**Given** a user has multiple accounts in the system
**And** some accounts are in collapsed state (not expanded)
**When** the user views the account list
**Then** each collapsed account **MUST** display its account ID badge at the leftmost position of the header
**And** the account ID **MUST** be visible without hovering or expanding

#### Scenario: Account ID Maintains Position When Expanded

**Given** an account card is displayed in collapsed state with ID visible
**When** the user clicks the expand button
**Then** the account ID badge **MUST** remain in the same leftmost position
**And** no layout shift **MUST** occur for the account ID

### Requirement: Expand/Collapse Button Must Have Fixed Position

The expand and collapse buttons **MUST** maintain the same fixed position in the account header, preventing the need for mouse repositioning during toggle operations.

**Rationale:** When the expand button moves position after clicking, users must reposition their mouse to collapse, creating unnecessary friction. A fixed position enables rapid expand/collapse operations without mouse movement.

#### Scenario: Expand Button Has Fixed Position

**Given** an account card is in collapsed state
**When** the user views the card
**Then** the expand button **MUST** be positioned at the rightmost location of the header
**And** the button position **MUST** be consistent across all collapsed accounts

#### Scenario: Collapse Button Appears in Same Position

**Given** an account card is in expanded state
**When** the user views the card
**Then** the collapse button **MUST** be positioned at the same rightmost location as the expand button
**And** the user **MUST** be able to click collapse without moving the mouse from the expand button location

#### Scenario: Rapid Toggle Without Mouse Movement

**Given** an account card with expand button visible
**When** the user clicks expand once
**And** waits for the card to expand
**And** clicks the same screen position again (without moving mouse)
**Then** the collapse button **MUST** be clicked
**And** the card **MUST** collapse back to its original state

## ADDED Requirements

### Requirement: Server Location Must Be Visible in Collapsed State

Account cards **MUST** display server location summary (Windows/Linux/Both/未配置) in the collapsed header, immediately after the account name.

**Rationale:** Users need to quickly see which server(s) each account is deployed on without expanding server login sections. This enables rapid infrastructure auditing and topology understanding.

#### Scenario: Server Location Shown for Windows Only

**Given** an account has Windows server configured with serverName
**And** Linux server is not configured
**When** the account is in collapsed state
**Then** the header **MUST** display "服务器: Windows"
**And** the Windows server name **MUST** be shown after the label

#### Scenario: Server Location Shown for Linux Only

**Given** an account has Linux server configured with serverName
**And** Windows server is not configured
**When** the account is in collapsed state
**Then** the header **MUST** display "服务器: Linux"
**And** the Linux server name **MUST** be shown after the label

#### Scenario: Server Location Shown for Both Servers

**Given** an account has both Windows and Linux servers configured
**When** the account is in collapsed state
**Then** the header **MUST** display "服务器: Windows, Linux"
**And** both server names **MUST** be shown

#### Scenario: Server Location Shows Not Configured

**Given** an account has neither Windows nor Linux server configured
**When** the account is in collapsed state
**Then** the header **MUST** display "服务器: 未配置"
**And** a placeholder space **MUST** be maintained for vertical alignment

### Requirement: Empty Fields Must Maintain Placeholder Spacing

When server names or other fields are empty, placeholder spacing **MUST** be preserved to maintain vertical alignment across multiple account cards.

**Rationale:** Consistent spacing enables users to visually scan columns of information vertically (e.g., all account IDs, all server names) even when some fields are empty.

#### Scenario: Empty Server Name Maintains Space

**Given** an account has no server name configured
**When** the account is displayed in collapsed state
**Then** a placeholder **MUST** be shown (e.g., "未配置" or empty space)
**And** the space occupied **MUST** be equal to typical server name field width
**And** subsequent elements **MUST** align with other accounts' elements

#### Scenario: Multiple Accounts Align Vertically

**Given** three accounts are displayed
**And** first account has server name "Server-01"
**And** second account has no server name
**And** third account has server name "Server-02"
**When** viewing all three cards
**Then** all account IDs **MUST** align vertically
**And** all server name positions **MUST** align vertically
**And** all expand buttons **MUST** align vertically
