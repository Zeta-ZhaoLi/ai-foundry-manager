# Tasks

## Phase 1: Data Model Updates

### 1.1 Update ServerCredentials Interface
- [ ] Add `serverName?: string` field to `ServerCredentials` interface in `src/hooks/useLocalAzureAccounts.ts`
- [ ] Verify backward compatibility (existing data without field)

### 1.2 Update Server Update Handlers
- [ ] Update `updateAccountWindowsServer` to preserve `serverName`
- [ ] Update `updateAccountLinuxServer` to preserve `serverName`
- [ ] Test handlers with partial data

## Phase 2: Account Card Layout Redesign

### 2.1 Collapsed Header Layout
- [ ] Redesign header structure in `AccountCard.tsx` collapsed view (line ~135-162)
- [ ] Move account ID badge to leftmost position
- [ ] Add server location summary display (Windows/Linux/Both/未配置)
- [ ] Position expand button at fixed rightmost location
- [ ] Implement placeholder spacing for empty fields

### 2.2 Expanded Header Layout
- [ ] Update expanded header to match new layout pattern
- [ ] Ensure collapse button stays in same position as expand button
- [ ] Test button position consistency

### 2.3 Server Name Input Fields
- [ ] Add "所在服务器" input field to Windows Server section
- [ ] Add "所在服务器" input field to Linux Server section
- [ ] Wire up inputs to update handlers
- [ ] Add placeholder text

## Phase 3: Summary Views Enhancement

### 3.1 Account Summary Component
- [ ] Update `AccountSummaryItem` interface to include server info
- [ ] Modify data generation in `useLocalAzureAccounts` hook
- [ ] Add Windows Server column to summary table
- [ ] Add Linux Server column to summary table
- [ ] Implement empty placeholder alignment
- [ ] Test with various data states

### 3.2 Model Overview Table
- [ ] Add "部署服务器" column header
- [ ] Create mapping from models to Linux server names
- [ ] Implement column rendering with server data
- [ ] Handle multiple servers per model (comma-separated or list)
- [ ] Ensure virtual scrolling still works efficiently

## Phase 4: Translations

### 4.1 Chinese Translations (zh.json)
- [ ] Add `accounts.serverName` ("所在服务器")
- [ ] Add `accounts.serverNamePlaceholder` ("例如：Main-Server-01")
- [ ] Add `accounts.serverLocation` ("服务器位置")
- [ ] Add `accounts.serverWindows` ("Windows")
- [ ] Add `accounts.serverLinux` ("Linux")
- [ ] Add `accounts.serverBoth` ("双服务器")
- [ ] Add `accounts.serverNotConfigured` ("未配置")
- [ ] Add `modelOverview.deploymentServer` ("部署服务器")
- [ ] Add `summary.windowsServer` ("Windows 服务器")
- [ ] Add `summary.linuxServer` ("Linux 服务器")

### 4.2 English Translations (en.json)
- [ ] Add `accounts.serverName` ("Server Name")
- [ ] Add `accounts.serverNamePlaceholder` ("e.g., Main-Server-01")
- [ ] Add `accounts.serverLocation` ("Server Location")
- [ ] Add `accounts.serverWindows` ("Windows")
- [ ] Add `accounts.serverLinux` ("Linux")
- [ ] Add `accounts.serverBoth` ("Both Servers")
- [ ] Add `accounts.serverNotConfigured` ("Not Configured")
- [ ] Add `modelOverview.deploymentServer` ("Deployment Server")
- [ ] Add `summary.windowsServer` ("Windows Server")
- [ ] Add `summary.linuxServer` ("Linux Server")

## Phase 5: Testing & Validation

### 5.1 Build & Type Check
- [ ] Run `npm run build`
- [ ] Verify no TypeScript errors
- [ ] Check bundle size is reasonable

### 5.2 Layout Testing
- [ ] Test collapsed account header layout
  - [ ] Account ID at leftmost position
  - [ ] Server location displayed correctly
  - [ ] Expand button stays in fixed position
- [ ] Test expanded account header layout
  - [ ] Collapse button in same position as expand button
  - [ ] No layout shift when toggling
- [ ] Test with empty server name fields
  - [ ] Placeholder spacing maintained
  - [ ] Vertical alignment consistent

### 5.3 Server Name Testing
- [ ] Add server names to Windows section
- [ ] Add server names to Linux section
- [ ] Verify names appear in collapsed header
- [ ] Test mixed states (only Windows, only Linux, both, neither)

### 5.4 Summary Views Testing
- [ ] Verify Account Summary shows server columns
- [ ] Verify Model Overview shows deployment server column
- [ ] Test with accounts that have no server config
- [ ] Test with accounts that have both servers
- [ ] Verify empty placeholder alignment

### 5.5 Responsive Testing
- [ ] Test on desktop (1920px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Verify layout wraps appropriately

### 5.6 Data Persistence
- [ ] Add server names and save
- [ ] Reload page and verify data persists
- [ ] Export config and verify server names included
- [ ] Import config and verify server names restored

### 5.7 Edge Cases
- [ ] Test with very long server names
- [ ] Test with special characters in server names
- [ ] Test with Unicode characters (中文, etc.)
- [ ] Test undo/redo operations
