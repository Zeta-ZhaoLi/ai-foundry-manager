# Remove Server Login Info

## REMOVED Requirements

### Requirement: Server Credential Fields

Accounts MUST NOT provide Windows/Linux server credential storage.

#### Scenario: Account data has no server fields

**Given** an existing account configuration

**When** the account is persisted (localStorage) or exported (JSON)

**Then** the account object MUST NOT contain `windowsServer` or `linuxServer` fields

---

### Requirement: UI Collapsible Section

The account card MUST NOT display a server login information section.

#### Scenario: Account card hides server login UI

**Given** an account card is rendered

**When** the user views the account card in expanded or collapsed state

**Then** the UI MUST NOT show a "Server Login Information" section

---

### Requirement: Show/Hide Password Toggle

Server password/SSH key show/hide controls MUST NOT exist because the server credential UI is removed.

#### Scenario: No server secret reveal controls

**Given** privacy mode is enabled or disabled

**When** the user views any account card

**Then** there is no server password/SSH-key input field and no related show/hide toggle

## ADDED Requirements

### Requirement: Legacy Server Fields Are Ignored

Legacy configurations MAY contain `windowsServer` / `linuxServer` fields. The system MUST accept such input and discard these fields without error.

#### Scenario: Import legacy config with server fields

**Given** an imported config JSON contains accounts with `windowsServer` and/or `linuxServer`

**When** the user imports the configuration

**Then** the import MUST succeed

**And** the resulting in-memory and persisted accounts MUST NOT contain server login fields
