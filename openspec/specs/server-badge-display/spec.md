# server-badge-display Specification

## Purpose
TBD - created by archiving change 2025-12-22-fix-model-search-and-improve-server-display. Update Purpose after archive.
## Requirements
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

