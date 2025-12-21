# Tasks

## Phase 1: Fix Model Search to Filter Accounts ✓
- [x] Import `parseModels` utility in AccountsSection.tsx
- [x] Implement `filteredAccounts` useMemo hook
- [x] Update account rendering to use `filteredAccounts` instead of `sortedAccounts`
- [x] Test with various search terms (empty, partial match, full match, no match)

## Phase 2: Server Badge Display ✓
- [x] Create `renderServerBadges()` helper function in AccountCard.tsx
- [x] Design badge styles with platform-specific colors
  - Windows badge: Blue accent (bg-blue-900/30, text-blue-300, border-blue-700)
  - Linux badge: Green accent (bg-green-900/30, text-green-300, border-green-700)
- [x] Update collapsed state header to show badges
- [x] Update expanded state header to show badges
- [x] Position badges between account ID and account name
- [x] Test responsive layout on mobile and desktop

## Phase 3: Server ID Data Model ✓
- [x] Update `ServerCredentials` interface in useLocalAzureAccounts.ts
  - Replace `serverName?: string` with `serverId?: string`
- [x] Create migration function `migrateServerNamesToIds()`
  - Extract trailing numbers from serverName (e.g., "Server-01" → "001")
  - If no numbers found, assign sequential IDs starting from "001"
- [x] Update `migrateAccountsToV2()` to call server migration
- [x] Test migration with various serverName formats

## Phase 4: Numeric Server ID Input ✓
- [x] Create server ID input component with spinner controls
  - Text input with pattern="[0-9]{3,}" and maxLength="5"
  - Up/down arrow buttons
- [x] Implement `handleServerIdChange()` to accept numeric input only
- [x] Implement `incrementServerId()` to increase by 1 (zero-padded)
- [x] Implement `decrementServerId()` to decrease by 1 (minimum 001)
- [x] Update Windows Server section with new input
- [x] Update Linux Server section with new input
- [x] Update label from "所在服务器" to "服务器编号"
- [x] Test increment/decrement behavior

## Phase 5: Translations & Testing ✓
- [x] Update zh.json
  - Change "serverName" to "serverId" ("服务器编号")
  - Add platform labels: "serverWindows", "serverLinux"
- [x] Update en.json
  - Change "serverName" to "serverId" ("Server ID")
  - Add platform labels: "serverWindows", "serverLinux"
- [x] Integration testing
  - [x] Verify model search filters accounts correctly
  - [x] Verify server badges display with correct colors
  - [x] Verify badge positioning on mobile and desktop
  - [x] Verify server ID input accepts only numbers
  - [x] Verify increment/decrement works correctly
  - [x] Verify data migration handles existing serverName values
  - [x] Verify localStorage persistence
- [x] Build verification: `npm run build`
