# Storage Key Documentation

## ADDED Requirements

### Requirement: localStorage Key Documentation

The README SHALL document localStorage keys using the current project name `ai-foundry-manager` prefix instead of the outdated `azure-openai-manager` prefix.

**Files:**
- `README.md`

#### Scenario: Data Storage section uses correct key names

**Given** a user reads the Data Storage section in README
**When** they review the localStorage keys listed
**Then** the README SHALL list `ai-foundry-manager:accounts` as the accounts key
**And** the README SHALL list `ai-foundry-manager:master-models` as the models key
**And** the README SHALL list `ai-foundry-manager:config-history` as the history key
**And** the README SHALL NOT reference `azure-openai-manager:accounts`
**And** the README SHALL NOT reference `azure-openai-manager:master-models`
**And** the README SHALL NOT reference `azure-openai-manager:config-history`

#### Scenario: All key references updated consistently

**Given** the README documents localStorage architecture
**When** searching for storage key references
**Then** all key names SHALL use `ai-foundry-manager:` prefix
**And** no occurrences of `azure-openai-manager:` SHALL exist in key documentation
