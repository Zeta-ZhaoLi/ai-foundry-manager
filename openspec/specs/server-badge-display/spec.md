# server-badge-display Specification

## Purpose
TBD - created by archiving change 2025-12-22-fix-model-search-and-improve-server-display. Update Purpose after archive.
## Requirements
### Requirement: Server Display Format

Server locations SHALL be displayed as styled badges positioned between account ID and account name, replacing the previous plain text format.

**Files:**
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`

#### Scenario: Windows badge displays with blue accent

**Given** an account has Windows server configured
**And** the Windows server has serverId "001"
**When** the account card is rendered
**Then** a badge SHALL be displayed with text "Win#001"
**And** the badge SHALL have blue accent colors (bg-blue-900/30, text-blue-300, border-blue-700)
**And** the badge SHALL be positioned between account ID and account name

#### Scenario: Linux badge displays with green accent

**Given** an account has Linux server configured
**And** the Linux server has serverId "002"
**When** the account card is rendered
**Then** a badge SHALL be displayed with text "Linux#002"
**And** the badge SHALL have green accent colors (bg-green-900/30, text-green-300, border-green-700)
**And** the badge SHALL be positioned between account ID and account name

#### Scenario: Both server badges displayed

**Given** an account has both Windows and Linux servers configured
**And** Windows serverId is "001"
**And** Linux serverId is "002"
**When** the account card is rendered
**Then** both badges SHALL be displayed
**And** badges SHALL be ordered: Account ID, Windows badge, Linux badge, Account name

#### Scenario: No badge when serverId not set

**Given** an account has Windows server configured
**But** the Windows server has no serverId set
**When** the account card is rendered
**Then** no Windows badge SHALL be displayed

#### Scenario: Badges visible in collapsed state

**Given** an account is disabled and collapsed
**And** the account has server badges
**When** the account card is rendered in collapsed state
**Then** the server badges SHALL be visible

#### Scenario: Responsive badge wrapping

**Given** an account has long name and multiple badges
**When** the account card is viewed on small screen
**Then** badges SHALL wrap to next line naturally
**And** each badge SHALL maintain its minimum width (shrink-0)

### Requirement: Data Model Change

The `ServerCredentials` interface SHALL use numeric server ID instead of free-form server name.

**Files:**
- `src/hooks/useLocalAzureAccounts.ts` (lines 24-32)

#### Scenario: ServerCredentials interface updated

**Given** the ServerCredentials interface
**When** defining server properties
**Then** the interface SHALL include `serverId?: string`
**And** the interface SHALL NOT include `serverName` field
**And** serverId SHALL be optional
**And** serverId SHALL be a zero-padded numeric string (e.g., "001", "002", "015")

### Requirement: Numeric Server ID Input

Server ID input fields SHALL accept only numeric values with spinner controls for increment/decrement.

**Files:**
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` (Windows Server section around line 542)
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` (Linux Server section around line 642)

#### Scenario: Default server ID value

**Given** a new server is being configured
**When** the server ID input is displayed
**Then** the default value SHALL be "001"

#### Scenario: Numeric input validation

**Given** the server ID input field
**When** the user types letters
**Then** the input SHALL reject the letters
**And** the value SHALL not change

**When** the user types "5"
**Then** the value SHALL be auto-padded to "005"

**When** the user types "123"
**Then** the value SHALL be displayed as "123"

#### Scenario: Input length constraints

**Given** the server ID input field
**When** the user types numeric digits
**Then** minimum 3 digits SHALL be enforced via auto-padding
**And** maximum 5 digits SHALL be enforced via maxLength
**And** the input pattern SHALL be `[0-9]{3,}`

#### Scenario: Increment server ID

**Given** the server ID is "001"
**When** the user clicks the increment button (▲)
**Then** the server ID SHALL change to "002"
**And** zero-padding SHALL be maintained

**Given** the server ID is "099"
**When** the user clicks the increment button
**Then** the server ID SHALL change to "100"

#### Scenario: Decrement server ID

**Given** the server ID is "002"
**When** the user clicks the decrement button (▼)
**Then** the server ID SHALL change to "001"

**Given** the server ID is "001"
**When** the user clicks the decrement button
**Then** the server ID SHALL remain "001"
**Because** decrement stops at minimum value 1

#### Scenario: Maximum value increment

**Given** the server ID is "99999"
**When** the user clicks the increment button
**Then** the system SHALL allow incrementing (no hard maximum)
**But** input SHALL be limited to 5 digits via maxLength

#### Scenario: Input UI styling

**Given** the server ID input field
**When** the field is rendered
**Then** the input SHALL be 80px wide (w-20)
**And** text SHALL be centered
**And** font SHALL be monospace
**And** spinner buttons SHALL be vertically stacked
**And** spinner buttons SHALL have no gap between them

### Requirement: Data Migration

Existing `serverName` values SHALL be automatically migrated to `serverId` format.

**Files:**
- `src/hooks/useLocalAzureAccounts.ts` (add migration function after migrateAccountsToV2)

#### Scenario: Migrate numeric suffix

**Given** an existing account has Windows server with serverName "Server-01"
**When** the migration runs
**Then** the serverId SHALL be extracted as "001"
**And** the serverName field SHALL be removed

**Given** serverName is "Main-Server-15"
**Then** serverId SHALL be "015"

**Given** serverName is "Linux-100"
**Then** serverId SHALL be "100"

#### Scenario: Migrate non-numeric serverName

**Given** an existing account has serverName "Production"
**And** the serverName has no trailing numbers
**When** the migration runs
**Then** serverId SHALL be set to "001" (default)
**And** the serverName field SHALL be removed

#### Scenario: Empty serverName migration

**Given** an existing account has empty serverName ""
**When** the migration runs
**Then** serverId SHALL be set to "001" (default)

#### Scenario: No migration when serverId exists

**Given** an existing account has both serverName and serverId
**When** the migration runs
**Then** the existing serverId SHALL be preserved
**And** the serverName SHALL be removed

#### Scenario: Migration runs once

**Given** accounts have been migrated
**When** the application loads again
**Then** migration SHALL not run again
**Because** serverId already exists

### Requirement: Translation Updates

The translations SHALL reflect the change from server name to server ID.

**Files:**
- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json`

#### Scenario: Chinese translations updated

**Given** the Chinese translation file
**Then** "serverName" key SHALL be replaced with "serverId" ("服务器编号")
**And** "serverNamePlaceholder" key SHALL be replaced with "serverIdPlaceholder" ("例如：001")
**And** new key "serverWindows" SHALL be added ("Windows")
**And** new key "serverLinux" SHALL be added ("Linux")

#### Scenario: English translations updated

**Given** the English translation file
**Then** "serverName" key SHALL be replaced with "serverId" ("Server ID")
**And** "serverNamePlaceholder" key SHALL be replaced with "serverIdPlaceholder" ("e.g., 001")
**And** new key "serverWindows" SHALL be added ("Windows")
**And** new key "serverLinux" SHALL be added ("Linux")

