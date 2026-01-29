# Remove Server Badges

## REMOVED Requirements

### Requirement: Server Display Format

The account header MUST NOT display Windows/Linux server badges.

#### Scenario: No Win/Linux badges

**Given** an account card is rendered

**When** the user views the account header area

**Then** the header MUST NOT render badges like "Win#001" or "Linux#002"

---

### Requirement: Numeric Server ID Input

Server ID input fields MUST NOT exist.

#### Scenario: No server ID input

**Given** an account card is rendered

**When** the user expands the account card

**Then** the UI MUST NOT contain a server ID input (including spinner increment/decrement controls)

---

### Requirement: Data Migration

Server-name/server-id migrations MUST NOT run because server fields are no longer supported.

#### Scenario: Legacy server fields are simply discarded

**Given** localStorage contains legacy server fields (e.g., `serverName` or `serverId` under server objects)

**When** the application loads

**Then** the system MUST discard server fields without performing any server-specific migration
