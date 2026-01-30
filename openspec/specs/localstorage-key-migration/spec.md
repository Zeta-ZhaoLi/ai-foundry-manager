# localstorage-key-migration Specification

## Purpose
TBD - created by archiving change 2025-12-22-migrate-localstorage-keys-to-new-project-name. Update Purpose after archive.
## Requirements
### Requirement: Accounts Storage Key Update

The application SHALL use `ai-foundry-manager:accounts` as the localStorage key for account configurations instead of `azure-openai-manager:accounts`.

**Files:**
- `src/hooks/useLocalAzureAccounts.ts`

#### Scenario: New installations use new key

**Given** a user installs the application for the first time
**When** the application saves account data
**Then** the data SHALL be stored under key `ai-foundry-manager:accounts`
**And** no data SHALL be stored under key `azure-openai-manager:accounts`

#### Scenario: Existing users have data migrated automatically

**Given** a user has existing data under key `azure-openai-manager:accounts`
**And** no data exists under key `ai-foundry-manager:accounts`
**When** the application loads for the first time after the update
**Then** the application SHALL copy all data from `azure-openai-manager:accounts` to `ai-foundry-manager:accounts`
**And** the application SHALL preserve all account properties (id, name, regions, models, credentials, tiers, quotas)
**And** the application SHALL log the migration event to console
**And** the old key `azure-openai-manager:accounts` SHALL remain unchanged

#### Scenario: Already migrated users continue normally

**Given** a user has data under key `ai-foundry-manager:accounts`
**When** the application loads
**Then** the application SHALL use data from `ai-foundry-manager:accounts`
**And** the application SHALL NOT attempt to migrate from `azure-openai-manager:accounts` again

### Requirement: Master Models Storage Key Update

The application SHALL use `ai-foundry-manager:master-models` as the localStorage key for the global model directory instead of `azure-openai-manager:master-models`.

**Files:**
- `src/components/AzureModelsDashboard.tsx`

#### Scenario: New installations use new key

**Given** a user installs the application for the first time
**When** the application saves master models data
**Then** the data SHALL be stored under key `ai-foundry-manager:master-models`

#### Scenario: Existing users have master models migrated

**Given** a user has existing data under key `azure-openai-manager:master-models`
**And** no data exists under key `ai-foundry-manager:master-models`
**When** the application loads the master models
**Then** the application SHALL copy all data from `azure-openai-manager:master-models` to `ai-foundry-manager:master-models`
**And** the application SHALL preserve all model classifications and series definitions

### Requirement: Configuration History Storage Key Update

The application SHALL use `ai-foundry-manager:config-history` as the localStorage key for configuration version history instead of `azure-openai-manager:config-history`.

**Files:**
- `src/hooks/useConfigHistory.ts`

#### Scenario: New installations use new key

**Given** a user installs the application for the first time
**When** the application saves configuration history
**Then** the data SHALL be stored under key `ai-foundry-manager:config-history`

#### Scenario: Existing users have history migrated

**Given** a user has existing data under key `azure-openai-manager:config-history`
**And** no data exists under key `ai-foundry-manager:config-history`
**When** the application loads configuration history
**Then** the application SHALL copy all history entries from old key to new key
**And** the application SHALL preserve all 20 historical configuration versions
**And** the application SHALL preserve timestamps and labels for each version

### Requirement: Theme Storage Key Update

The application SHALL use `ai-foundry-manager:theme` as the localStorage key for theme preference instead of `azure-openai-manager:theme`.

**Files:**
- `src/contexts/ThemeContext.tsx`

#### Scenario: New installations use new key

**Given** a user installs the application for the first time
**When** the application saves theme preference
**Then** the data SHALL be stored under key `ai-foundry-manager:theme`

#### Scenario: Existing users have theme preference migrated

**Given** a user has existing data under key `azure-openai-manager:theme`
**And** no data exists under key `ai-foundry-manager:theme`
**When** the application loads theme settings
**Then** the application SHALL copy theme preference from old key to new key
**And** the application SHALL preserve the selected theme (dark/light/system)

### Requirement: Language Storage Key Update

The language preference migration MUST preserve the selected language across all supported languages.

#### Scenario: Existing users have language preference migrated

**Given** a user has existing data under key `azure-openai-manager:lang`

**And** no data exists under key `ai-foundry-manager:lang`

**When** the application initializes i18n

**Then** the application SHALL copy language preference from old key to new key

**And** the application SHALL preserve the selected language when it is one of the supported languages (`zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`)

**And** the application SHALL fall back to a supported default if the stored value is not supported

### Requirement: Audit Log Storage Key Update

The application SHALL use `ai-foundry-manager:audit-log` as the localStorage key for audit log entries instead of `azure-openai-manager:audit-log`.

**Files:**
- `src/hooks/useAuditLog.ts`

#### Scenario: New installations use new key

**Given** a user installs the application for the first time
**When** the application saves audit log entries
**Then** the data SHALL be stored under key `ai-foundry-manager:audit-log`

#### Scenario: Existing users have audit log migrated

**Given** a user has existing data under key `azure-openai-manager:audit-log`
**And** no data exists under key `ai-foundry-manager:audit-log`
**When** the application loads audit log
**Then** the application SHALL copy all audit entries from old key to new key
**And** the application SHALL preserve all historical audit events

### Requirement: Export Filename Update

Configuration export files SHALL use the filename `ai-foundry-manager-config.json` instead of `azure-openai-manager-config.json`.

**Files:**
- `src/components/AzureModelsDashboard.tsx`

#### Scenario: Export uses new filename

**Given** a user exports their configuration
**When** the download dialog appears
**Then** the default filename SHALL be `ai-foundry-manager-config.json`
**And** the filename SHALL NOT be `azure-openai-manager-config.json`

### Requirement: Migration Safety

Data migration SHALL preserve all existing user data without loss or corruption.

**Files:**
- All migration implementations

#### Scenario: No data loss during migration

**Given** a user has existing data in all old localStorage keys
**When** the application performs migration
**Then** all user data SHALL be preserved exactly as stored
**And** no accounts SHALL be lost
**And** no models SHALL be lost
**And** no configuration history SHALL be lost
**And** no preferences SHALL be changed

#### Scenario: Old keys remain intact

**Given** a user has existing data in old localStorage keys
**When** the application performs migration
**Then** the old keys SHALL NOT be deleted
**And** the old data SHALL remain accessible for manual cleanup

