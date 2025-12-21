# Implementation Tasks

This document breaks down the implementation of account ID prefixes, server login information, and endpoint auto-conversion into small, verifiable work items. Tasks are organized by feature and ordered for logical progression.

## Phase 1: Account ID Prefix (Spec: account-id-prefix)

### Task 1.1: Create Account ID Generator Utility

**File**: `src/utils/accountIdGenerator.ts` (NEW)

**Description**: Implement utility functions for generating and managing tier-based account IDs.

**Implementation**:
- Create `generateAccountId(accounts: LocalAccount[], tier: AccountTier): string` function
- Algorithm: Find highest existing number for tier, return next available (starting from 1)
- Support ID reuse when accounts are deleted (fill gaps)
- Format: `{PREFIX}{NUMBER}` where PREFIX is "A" or "B", NUMBER is 3-digit zero-padded
- Include unit tests for sequential generation, gap filling, and tier separation

**Validation**:
- Run unit tests: All ID generation scenarios pass
- Test edge case: Empty account list returns "A001" for premium, "B001" for standard
- Test reuse: Deleting A002 makes next premium account get A002
- Test uniqueness: No duplicate IDs generated across multiple calls

**Dependencies**: None

---

### Task 1.2: Update LocalAccount Type Definition

**File**: `src/hooks/useLocalAzureAccounts.ts`

**Description**: Add `accountId` field to LocalAccount interface.

**Implementation**:
- Add `accountId?: string` to LocalAccount interface
- Field is optional to support migration of existing accounts

**Validation**:
- TypeScript compiles without errors
- Existing account objects remain compatible (optional field)

**Dependencies**: None

---

### Task 1.3: Implement ID Assignment Logic in Hook

**File**: `src/hooks/useLocalAzureAccounts.ts`

**Description**: Auto-assign account IDs when creating or updating accounts.

**Implementation**:
- Import `generateAccountId` from accountIdGenerator utility
- In `addAccount()`: Call `generateAccountId()` to assign ID to new account
- In `updateAccountTier()`: Regenerate ID when tier changes, update account
- Create migration function `migrateAccountsToV2()` to assign IDs to existing accounts without IDs
- Call migration function in `useEffect` on initial load

**Validation**:
- Create new premium account → ID assigned as A001 (or next available)
- Create new standard account → ID assigned as B001 (or next available)
- Change account tier from premium to standard → ID changes from Axxx to Byyy
- Load existing config without IDs → IDs auto-assigned on load
- Check localStorage after operations → accountId field is persisted

**Dependencies**: Task 1.1, Task 1.2

---

### Task 1.4: Display Account ID in AccountCard UI

**File**: `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`

**Description**: Add read-only account ID badge next to tier selector.

**Implementation**:
- Add account ID display as badge component
- Position next to tier selector in account header
- Style premium IDs (A-series) with gold/yellow color
- Style standard IDs (B-series) with silver/gray color
- Badge should be small, non-editable, and clearly visible
- Hide badge in privacy mode (optional - or show as "Axxx"/"Bxxx")

**Validation**:
- Premium account shows badge like "[A001]" in gold/yellow
- Standard account shows badge like "[B005]" in silver/gray
- Badge is not editable (read-only)
- Badge updates when tier is changed
- Badge persists after page refresh

**Dependencies**: Task 1.3

---

### Task 1.5: Add i18n Translations for Account ID

**Files**:
- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json`

**Description**: Add translation keys for account ID labels and tooltips.

**Implementation**:
- Add `accounts.accountId` label
- Add `accounts.accountIdTooltip` for explaining the ID system
- Add any other account ID-related strings

**Sample translations**:
```json
// zh.json
"accounts": {
  "accountId": "账号 ID",
  "accountIdTooltip": "系统自动分配的账号标识，A 系列为高级账号，B 系列为普通账号"
}

// en.json
"accounts": {
  "accountId": "Account ID",
  "accountIdTooltip": "System-assigned identifier, A-series for premium, B-series for standard"
}
```

**Validation**:
- Switch language to Chinese → Account ID labels display in Chinese
- Switch language to English → Account ID labels display in English
- Tooltip text is clear and helpful

**Dependencies**: Task 1.4

---

### Task 1.6: Test Account ID Feature End-to-End

**Description**: Comprehensive testing of all account ID scenarios.

**Test Cases**:
1. Create first premium account → Gets A001
2. Create second premium account → Gets A002
3. Create first standard account → Gets B001
4. Delete A001, create new premium → Reuses A001
5. Change A002 from premium to standard → Becomes B002
6. Change B001 from standard to premium → Becomes A002 (or next available)
7. Export config → accountId included in JSON
8. Import config with IDs → IDs preserved
9. Import old config without IDs → IDs auto-assigned
10. Multiple rapid account creations → No duplicate IDs

**Validation**: All test cases pass without errors

**Dependencies**: Tasks 1.1-1.5

---

## Phase 2: Server Login Information (Spec: server-login-info)

### Task 2.1: Define ServerCredentials Type

**File**: `src/types/channel.ts`

**Description**: Create TypeScript interface for server credentials.

**Implementation**:
```typescript
export interface ServerCredentials {
  host: string;
  username: string;
  password?: string;
  sshKey?: string;
  port?: number;
  note?: string;
}
```

**Validation**:
- TypeScript compiles without errors
- Interface matches spec requirements

**Dependencies**: None

---

### Task 2.2: Extend LocalAccount with Server Fields

**File**: `src/hooks/useLocalAzureAccounts.ts`

**Description**: Add Windows and Linux server credential fields to LocalAccount.

**Implementation**:
- Import ServerCredentials type
- Add `windowsServer?: ServerCredentials` to LocalAccount interface
- Add `linuxServer?: ServerCredentials` to LocalAccount interface

**Validation**:
- TypeScript compiles without errors
- Existing accounts remain compatible (optional fields)

**Dependencies**: Task 2.1

---

### Task 2.3: Extend Encryption to Cover Server Credentials

**File**: `src/hooks/useLocalAzureAccounts.ts`

**Description**: Update encryption functions to encrypt server passwords and SSH keys.

**Implementation**:
- Update `encryptAccounts()` function:
  - Encrypt `windowsServer.password` if present
  - Encrypt `linuxServer.password` if present
  - Encrypt `linuxServer.sshKey` if present
  - Keep other fields (host, username, port, note) unencrypted
- Update `decryptAccounts()` function:
  - Decrypt the encrypted fields on load
  - Handle missing fields gracefully

**Validation**:
- Save account with Windows password → Stored encrypted in localStorage
- Load account → Password decrypted correctly
- Save account with SSH key → Stored encrypted in localStorage
- Load account → SSH key decrypted correctly
- Non-sensitive fields (host, username) remain plain text in storage

**Dependencies**: Task 2.2

---

### Task 2.4: Add Update Handlers for Server Credentials

**File**: `src/hooks/useLocalAzureAccounts.ts`

**Description**: Create callback functions to update server credentials.

**Implementation**:
- Create `updateAccountWindowsServer(accountId: string, credentials: ServerCredentials | undefined)`
- Create `updateAccountLinuxServer(accountId: string, credentials: ServerCredentials | undefined)`
- Both functions use `saveAccounts` to persist changes
- Support clearing credentials by passing `undefined`

**Validation**:
- Call `updateAccountWindowsServer` → Windows credentials updated in state and localStorage
- Call `updateAccountLinuxServer` → Linux credentials updated in state and localStorage
- Pass `undefined` → Credentials cleared from account

**Dependencies**: Task 2.3

---

### Task 2.5: Create Server Login UI Section in AccountCard

**File**: `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`

**Description**: Add collapsible "Server Login Information" section with credential input fields.

**Implementation**:
- Add collapsible section after quota/purchase information
- Section header: "🖥️ Server Login Information" with collapse toggle
- Windows Server subsection:
  - Host input (text)
  - Port input (number, default 3389)
  - Username input (text)
  - Password input (password type) with show/hide toggle and copy button
  - Note input (textarea, optional)
- Linux Server subsection:
  - Host input (text)
  - Port input (number, default 22)
  - Username input (text)
  - Auth method toggle (Password / SSH Key)
  - Password input OR SSH Key textarea (based on toggle)
  - Show/hide toggle and copy button for both auth methods
  - Note input (textarea, optional)
- Apply privacy mode: Hide all fields with "***" when enabled
- Wire up all inputs to call update handlers from hook

**Validation**:
- Section collapses and expands correctly
- All input fields save values on change
- Show/hide toggles work for password and SSH key
- Copy buttons copy values to clipboard
- Privacy mode hides all sensitive information
- Port defaults display correctly (3389 for Windows, 22 for Linux)
- Auth method toggle switches between password and SSH key inputs

**Dependencies**: Task 2.4

---

### Task 2.6: Add i18n Translations for Server Credentials

**Files**:
- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json`

**Description**: Add translation keys for all server credential UI elements.

**Implementation**:
- Add section labels, field labels, placeholders, tooltips
- Cover both Windows and Linux server fields
- Add auth method toggle labels
- Add copy success messages

**Sample translations**:
```json
// zh.json
"accounts": {
  "serverLoginInfo": "服务器登录信息",
  "windowsServer": "Windows 服务器（登录）",
  "linuxServer": "Linux 服务器（API）",
  "host": "主机",
  "hostPlaceholder": "IP 地址或主机名",
  "port": "端口",
  "username": "用户名",
  "password": "密码",
  "sshKey": "SSH 密钥",
  "authMethod": "认证方式",
  "authPassword": "密码",
  "authSSHKey": "SSH 密钥",
  "serverNote": "备注",
  "serverNotePlaceholder": "可选备注信息"
}
```

**Validation**:
- All server credential labels display in both languages
- Language switching updates all server-related text
- Placeholders and tooltips are helpful and clear

**Dependencies**: Task 2.5

---

### Task 2.7: Test Server Credentials Feature End-to-End

**Description**: Comprehensive testing of server credential functionality.

**Test Cases**:
1. Add Windows server credentials → Saved and encrypted
2. Add Linux server with password → Saved and encrypted
3. Add Linux server with SSH key → Saved and encrypted
4. Show/hide password → Toggles visibility correctly
5. Show/hide SSH key → Toggles visibility correctly
6. Copy password to clipboard → Copies correctly, toast shown
7. Copy SSH key to clipboard → Copies correctly, toast shown
8. Enable privacy mode → All server fields hidden/masked
9. Disable privacy mode → Fields visible again
10. Export config → Server credentials included (encrypted)
11. Import config → Server credentials restored correctly
12. Clear server credentials → Fields removed from account
13. Collapse/expand section → State persists

**Validation**: All test cases pass without errors

**Dependencies**: Tasks 2.1-2.6

---

## Phase 3: Endpoint Auto-Conversion (Spec: endpoint-auto-conversion)

### Task 3.1: Create Endpoint Conversion Utilities

**File**: `src/utils/common.ts`

**Description**: Implement endpoint conversion and resource name extraction functions.

**Implementation**:
- Add `extractAzureResourceName(endpoint: string): string | null`
  - Extract resource name from `*.openai.azure.com` or `*.services.ai.azure.com` patterns
  - Return null if not a recognized Azure pattern
  - Handle malformed URLs gracefully
- Add `convertOpenAIToAnthropicEndpoint(openaiEndpoint: string): string | null`
  - Extract resource name from OpenAI endpoint
  - Return `https://{resource}.services.ai.azure.com/anthropic`
  - Return null if extraction fails
- Add `convertAnthropicToOpenAIEndpoint(anthropicEndpoint: string): string | null`
  - Extract resource name from Anthropic endpoint
  - Return `https://{resource}.openai.azure.com`
  - Return null if extraction fails
- Include unit tests for all functions with valid and invalid inputs

**Validation**:
- `extractAzureResourceName("https://test.openai.azure.com")` returns "test"
- `extractAzureResourceName("https://test.services.ai.azure.com/anthropic")` returns "test"
- `extractAzureResourceName("https://example.com")` returns null
- `convertOpenAIToAnthropicEndpoint("https://test.openai.azure.com")` returns "https://test.services.ai.azure.com/anthropic"
- `convertAnthropicToOpenAIEndpoint("https://test.services.ai.azure.com/anthropic")` returns "https://test.openai.azure.com"
- Malformed URLs return null without throwing errors

**Dependencies**: None

---

### Task 3.2: Add Override Flags to LocalRegion Type

**File**: `src/hooks/useLocalAzureAccounts.ts`

**Description**: Extend LocalRegion interface with manual override tracking fields.

**Implementation**:
- Add `openaiEndpointManualOverride?: boolean` to LocalRegion interface
- Add `anthropicEndpointManualOverride?: boolean` to LocalRegion interface

**Validation**:
- TypeScript compiles without errors
- Existing regions remain compatible (optional fields default to false)

**Dependencies**: None

---

### Task 3.3: Implement Auto-Sync Logic in RegionCard

**File**: `src/components/Dashboard/AccountConfiguration/RegionCard.tsx`

**Description**: Add bidirectional endpoint auto-conversion with override detection.

**Implementation**:
- Import conversion functions from `src/utils/common.ts`
- Create handler for OpenAI endpoint changes:
  - Normalize input using `normalizeOpenAIEndpoint()`
  - If Anthropic endpoint is empty OR not manually overridden:
    - Generate Anthropic endpoint using `convertOpenAIToAnthropicEndpoint()`
    - Update Anthropic endpoint
    - Ensure anthropicEndpointManualOverride remains false
  - If Anthropic endpoint is manually overridden:
    - Don't update Anthropic endpoint
- Create handler for Anthropic endpoint changes:
  - Normalize input using `normalizeAnthropicEndpoint()`
  - Detect manual override: If changing an auto-generated value to something different, set override flag
  - If OpenAI endpoint is empty OR not manually overridden:
    - Generate OpenAI endpoint using `convertAnthropicToOpenAIEndpoint()`
    - Update OpenAI endpoint
    - Ensure openaiEndpointManualOverride remains false
- Handle clearing fields: Reset override flag when field is cleared
- Gracefully handle conversion failures (null returns)

**Validation**:
- Enter OpenAI endpoint → Anthropic endpoint auto-generated
- Enter Anthropic endpoint → OpenAI endpoint auto-generated
- Manually edit auto-generated endpoint → Override flag set
- Change source endpoint after override → Target remains unchanged
- Clear overridden field → Override flag reset, auto-sync resumes
- Enter non-Azure URL → No auto-generation, no errors

**Dependencies**: Task 3.1, Task 3.2

---

### Task 3.4: Add Visual Indicators for Sync Status

**File**: `src/components/Dashboard/AccountConfiguration/RegionCard.tsx`

**Description**: Display icons next to endpoint fields showing sync status.

**Implementation**:
- Add icon next to OpenAI Endpoint field:
  - Show 🔄 if auto-synced from Anthropic endpoint
  - Show ✏️ if manually overridden
  - Show nothing if manually entered (no auto-sync)
- Add icon next to Anthropic Endpoint field:
  - Show 🔄 if auto-synced from OpenAI endpoint
  - Show ✏️ if manually overridden
  - Show nothing if manually entered (no auto-sync)
- Add tooltips on hover:
  - 🔄: "Auto-synced from {other} Endpoint"
  - ✏️: "Manually edited - auto-sync disabled"
- Icons should be subtle and positioned consistently

**Validation**:
- Auto-generated field shows 🔄 icon
- Manually overridden field shows ✏️ icon
- Manually entered field shows no icon
- Hovering over icons displays helpful tooltips
- Icons update dynamically when sync status changes

**Dependencies**: Task 3.3

---

### Task 3.5: Update Hook to Support Override Flag Updates

**File**: `src/hooks/useLocalAzureAccounts.ts`

**Description**: Add handler to update override flags for regions.

**Implementation**:
- Create `updateRegionEndpointOverride(accountId: string, regionId: string, field: 'openai' | 'anthropic', override: boolean)`
- Function updates the appropriate override flag in region state
- Persist changes to localStorage

**Validation**:
- Call function to set override → Flag updated in state and localStorage
- Call function to clear override → Flag set to false

**Dependencies**: Task 3.2

---

### Task 3.6: Add i18n Translations for Endpoint Auto-Sync

**Files**:
- `src/i18n/locales/zh.json`
- `src/i18n/locales/en.json`

**Description**: Add translation keys for sync indicators and tooltips.

**Implementation**:
- Add tooltip texts for sync and override indicators
- Add any help text explaining auto-sync behavior

**Sample translations**:
```json
// zh.json
"regions": {
  "endpointAutoSynced": "从 {type} Endpoint 自动同步",
  "endpointManualOverride": "手动编辑 - 已禁用自动同步",
  "endpointAutoSyncHelp": "输入任一 Endpoint 时，另一个将自动生成。手动修改后将停止自动同步。"
}

// en.json
"regions": {
  "endpointAutoSynced": "Auto-synced from {type} Endpoint",
  "endpointManualOverride": "Manually edited - auto-sync disabled",
  "endpointAutoSyncHelp": "When entering either endpoint, the other is auto-generated. Manual edits disable auto-sync."
}
```

**Validation**:
- Tooltips display correctly in both languages
- Language switching updates tooltip text

**Dependencies**: Task 3.4

---

### Task 3.7: Test Endpoint Auto-Conversion End-to-End

**Description**: Comprehensive testing of endpoint auto-conversion functionality.

**Test Cases**:
1. Enter OpenAI endpoint → Anthropic auto-generated, 🔄 shown
2. Enter Anthropic endpoint → OpenAI auto-generated, 🔄 shown
3. Update OpenAI endpoint → Anthropic updates if not overridden
4. Manually edit auto-generated Anthropic → ✏️ shown, override flag set
5. Change OpenAI after override → Anthropic unchanged
6. Clear overridden Anthropic → Override reset, auto-sync resumes, 🔄 shown
7. Enter OpenAI with trailing slash → Normalized and Anthropic generated
8. Enter Anthropic with /v1/messages → Normalized and OpenAI generated
9. Enter non-Azure URL → No auto-generation, no errors
10. Enter malformed URL → No auto-generation, no errors
11. Override both directions independently → Each has its own override flag
12. Export config → Override flags included in JSON
13. Import config → Override flags restored, sync behavior correct

**Validation**: All test cases pass without errors

**Dependencies**: Tasks 3.1-3.6

---

## Phase 4: Integration and Final Testing

### Task 4.1: Integration Testing Across All Features

**Description**: Test interactions between all three features.

**Test Cases**:
1. Create premium account → Account ID assigned, server fields available, endpoint auto-sync works
2. Change account tier → ID reassigns, server info preserved, regions unaffected
3. Add server credentials and endpoints → Both save correctly and independently
4. Privacy mode → Hides account ID (optional), server credentials, and endpoint values
5. Export config → All three features' data included in JSON
6. Import config → All features restored correctly
7. Delete account → ID becomes available, server info removed, regions removed
8. Rapid account operations → No race conditions or data corruption

**Validation**: All integration scenarios work correctly without conflicts

**Dependencies**: All Phase 1, 2, 3 tasks

---

### Task 4.2: Performance Testing

**Description**: Verify performance with realistic data volumes.

**Test Cases**:
1. Create 50 accounts with mixed tiers → ID generation remains fast
2. Each account has 10 regions with endpoints → Auto-sync responsive
3. Each account has server credentials → Encryption/decryption fast
4. Export large config → Completes in <5 seconds
5. Import large config → Loads in <5 seconds
6. Switch privacy mode → UI updates quickly

**Validation**: No noticeable performance degradation

**Dependencies**: Task 4.1

---

### Task 4.3: Cross-Browser Testing

**Description**: Verify functionality in major browsers.

**Test Browsers**:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest, if available)

**Test Cases**:
1. All features work correctly
2. localStorage persists data
3. Encryption/decryption works
4. UI renders correctly
5. No console errors

**Validation**: All features work in all tested browsers

**Dependencies**: Task 4.1

---

### Task 4.4: Responsive Design Testing

**Description**: Verify UI works on different screen sizes.

**Test Sizes**:
- Desktop (1920x1080)
- Laptop (1366x768)
- Tablet (768x1024)
- Mobile (375x667)

**Test Cases**:
1. Account ID badge visible and readable
2. Server credential fields accessible
3. Endpoint fields with icons fit properly
4. No horizontal scrolling
5. Touch-friendly buttons on mobile

**Validation**: UI is usable on all screen sizes

**Dependencies**: Task 4.1

---

### Task 4.5: Documentation and Code Review

**Description**: Final code review and documentation update.

**Actions**:
- Review all code for consistency and best practices
- Add JSDoc comments to new functions
- Update README.md if needed
- Update IMPROVEMENTS.md with new features
- Verify all Chinese comments are clear
- Check for unused imports or variables
- Run linter and fix all issues

**Validation**:
- `npm run lint` passes with no errors
- Code is well-documented
- No TODO or FIXME comments remain

**Dependencies**: All previous tasks

---

### Task 4.6: Create Release Notes

**Description**: Document the new features for users.

**Content**:
- Summary of three new features
- Screenshots or GIFs demonstrating usage
- Migration notes (existing configs will auto-upgrade)
- Security considerations (server credentials encryption)
- Known limitations

**Validation**: Release notes are clear and comprehensive

**Dependencies**: Task 4.5

---

## Task Summary

**Total Tasks**: 28 tasks across 4 phases

**Estimated Effort**:
- Phase 1 (Account ID Prefix): 6 tasks, ~4-6 hours
- Phase 2 (Server Login Info): 7 tasks, ~6-8 hours
- Phase 3 (Endpoint Auto-Conversion): 7 tasks, ~6-8 hours
- Phase 4 (Integration & Testing): 8 tasks, ~4-6 hours

**Total Estimated Effort**: ~20-28 hours

**Key Dependencies**:
- Phase 1 has no external dependencies (can start immediately)
- Phase 2 has no external dependencies (can start in parallel with Phase 1)
- Phase 3 has no external dependencies (can start in parallel with Phase 1 & 2)
- Phase 4 requires all previous phases to be complete

**Parallel Work Opportunities**:
- Phases 1, 2, and 3 can be developed in parallel
- Utility functions (Task 1.1, 3.1) can be developed first
- Type definitions (Task 1.2, 2.1, 3.2) can be done early
- UI work can start after hooks and types are ready
