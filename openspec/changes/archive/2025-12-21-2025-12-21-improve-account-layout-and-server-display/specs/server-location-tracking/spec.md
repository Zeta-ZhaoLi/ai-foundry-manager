# Server Location Tracking - Physical Server Identification

## ADDED Requirements

### Requirement: Server Credentials Must Include Server Name

The `ServerCredentials` interface **MUST** include an optional `serverName` field to track the physical server machine identifier.

**Rationale:** Users need to record which physical server host each account is configured on (e.g., "Main-Server-01", "Backup-API-Host"). This enables infrastructure inventory management and quick identification of server deployment topology.

#### Scenario: Server Name Added to Windows Credentials

**Given** a user is configuring Windows server credentials for an account
**When** the user enters a server name (e.g., "WinServer-01")
**And** saves the configuration
**Then** the serverName **MUST** be stored in the WindowsServer credentials object
**And** the serverName **MUST** be persisted to localStorage
**And** the serverName **MUST** be retrievable on next page load

#### Scenario: Server Name Added to Linux Credentials

**Given** a user is configuring Linux server credentials for an account
**When** the user enters a server name (e.g., "LinuxAPI-01")
**And** saves the configuration
**Then** the serverName **MUST** be stored in the LinuxServer credentials object
**And** the serverName **MUST** be persisted to localStorage
**And** the serverName **MUST** be retrievable on next page load

#### Scenario: Server Name Is Optional

**Given** a user is configuring server credentials
**When** the user leaves the server name field empty
**And** saves the configuration
**Then** the system **MUST** accept empty serverName
**And** other credential fields **MUST** save normally
**And** no validation error **MUST** occur

#### Scenario: Existing Data Without Server Name Remains Valid

**Given** an existing account has server credentials saved before serverName feature
**When** the application loads the account data
**Then** the account **MUST** load successfully
**And** serverName **MUST** be treated as undefined/empty
**And** no data corruption **MUST** occur

### Requirement: Server Name Must Display in Collapsed Account Header

When an account has server credentials with serverName configured, the name **MUST** be displayed in the collapsed account header.

**Rationale:** Quick visibility of server deployment locations enables rapid infrastructure auditing without expanding each account.

#### Scenario: Windows Server Name Shown in Header

**Given** an account has Windows server with serverName "WinHost-01"
**And** the account is collapsed
**When** rendering the account card
**Then** the header **MUST** display "服务器: WinHost-01 (Windows)"

#### Scenario: Linux Server Name Shown in Header

**Given** an account has Linux server with serverName "LinuxAPI-01"
**And** the account is collapsed
**When** rendering the account card
**Then** the header **MUST** display "服务器: LinuxAPI-01 (Linux)"

#### Scenario: Both Server Names Shown in Header

**Given** an account has Windows server "WinHost-01" and Linux server "LinuxAPI-01"
**And** the account is collapsed
**When** rendering the account card
**Then** the header **MUST** display both server names
**And** the format **MUST** clearly distinguish Windows and Linux servers

### Requirement: Server Name Must Persist Through Updates

When updating other server credential fields, the serverName **MUST** be preserved and not lost.

**Rationale:** Partial updates to server credentials (e.g., changing password) should not erase the server name, which is independently useful metadata.

#### Scenario: Updating Password Preserves Server Name

**Given** an account has Windows server with serverName "WinHost-01"
**When** a user updates the Windows server password
**And** saves the changes
**Then** the serverName "WinHost-01" **MUST** remain unchanged
**And** both password and serverName **MUST** be saved correctly

#### Scenario: Updating Host Preserves Server Name

**Given** an account has Linux server with serverName "LinuxAPI-01"
**When** a user updates the Linux server host address
**And** saves the changes
**Then** the serverName "LinuxAPI-01" **MUST** remain unchanged
**And** both host and serverName **MUST** be saved correctly

### Requirement: Server Name Must Be Included in Config Export/Import

The serverName field **MUST** be included when exporting configuration to JSON and correctly restored when importing.

**Rationale:** Infrastructure metadata like server names is critical for backup/restore operations and must not be lost during export/import cycles.

#### Scenario: Server Name Exported to JSON

**Given** an account has Windows server with serverName "WinHost-01"
**When** the user exports the configuration
**Then** the JSON export **MUST** include the windowsServer.serverName field
**And** the value **MUST** be "WinHost-01"

#### Scenario: Server Name Imported from JSON

**Given** a JSON config contains an account with windowsServer.serverName "WinHost-01"
**When** the user imports this configuration
**Then** the account **MUST** be created with Windows server name "WinHost-01"
**And** the serverName **MUST** be visible in the UI after import
