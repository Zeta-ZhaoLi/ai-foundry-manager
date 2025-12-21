# Fix Model Search and Improve Server Display

## Why

Three issues need to be addressed in the Azure account configuration section:

1. **Model search doesn't filter accounts**: Currently, the "模型搜索" (Model Search) feature filters models but doesn't filter which accounts are displayed. Users expect to see only accounts that contain the searched models.

2. **Server display lacks visual clarity**: The server location currently displays as plain text after the account name. It should be styled as a badge similar to the account ID, positioned between the account ID and account name for better visual hierarchy.

3. **Server name is free-form text**: Users requested numeric server IDs (001, 002, etc.) with increment/decrement controls instead of free-form server names. This provides standardized identification and easier management.

## What Changes

### 1. Fix Model Search to Filter Accounts

**Current Behavior:**
- Model search input updates `modelFilterInput` and `filteredModels`
- All accounts are always displayed regardless of search
- Filtered models affect region display within each account

**New Behavior:**
- When user searches for a model (e.g., "gpt-4o"), only show accounts that have regions containing that model
- Empty search shows all accounts (current behavior)
- Accounts without matching models are hidden

**Implementation:**
Add account filtering logic in `AccountsSection.tsx`:
```typescript
const filteredAccounts = useMemo(() => {
  if (!modelFilterInput.trim()) return sortedAccounts;

  return sortedAccounts.filter(({ account }) => {
    return account.regions.some(region => {
      const models = parseModels(region.modelsText);
      return models.some(model =>
        model.toLowerCase().includes(modelFilterInput.toLowerCase())
      );
    });
  });
}, [sortedAccounts, modelFilterInput]);
```

### 2. Redesign Server Display as Badges

**Current Display:**
```
[A001] Account Name  服务器: Server-01 (Win), Server-02 (Linux)
```

**New Display:**
```
[A001] [Win#001] [Linux#002] Account Name
```

**Badge Design:**
- Similar styling to account ID badge
- Two-part badge: Platform label (Win/Linux) + Server number (#001)
- Left side colored/styled to indicate platform
- Windows badge: Blue accent
- Linux badge: Green accent
- Positioned between account ID and account name

### 3. Change Server Name to Numeric Server ID

**Data Model Change:**
Replace `serverName?: string` with `serverId?: string` in `ServerCredentials`:
```typescript
export interface ServerCredentials {
  host: string;
  username: string;
  password?: string;
  sshKey?: string;
  port?: number;
  note?: string;
  serverId?: string;  // Numeric ID like "001", "002", "015"
}
```

**UI Changes:**
- Label: "所在服务器" → "服务器编号"
- Input: Text field → Numeric input with increment/decrement buttons
- Format: Three-digit zero-padded numbers (001, 002, 015)
- Spinner controls: Click up/down arrows to increment/decrement

**Input Component:**
```typescript
<div className="flex items-center gap-1">
  <input
    type="text"
    value={serverId || "001"}
    onChange={handleServerIdChange}
    pattern="[0-9]{3,}"
    maxLength="5"
  />
  <div className="flex flex-col">
    <button onClick={() => incrementServerId()}>▲</button>
    <button onClick={() => decrementServerId()}>▼</button>
  </div>
</div>
```

## Files Affected

### Account Filtering
- `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx`
  - Add `filteredAccounts` computed value based on model search
  - Update rendering to use `filteredAccounts` instead of `sortedAccounts`

### Server Badge Display
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`
  - Replace `getServerLocationSummary()` with `renderServerBadges()`
  - Create badge components for Windows and Linux servers
  - Position badges between account ID and account name
  - Style badges to match account ID badge pattern

### Server ID Data Model
- `src/hooks/useLocalAzureAccounts.ts`
  - Rename `serverName` to `serverId` in `ServerCredentials` interface
  - Add migration logic to convert existing `serverName` to `serverId`

### Server ID Input
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`
  - Replace text input with numeric input + spinner controls
  - Add increment/decrement handlers
  - Format display as zero-padded 3-digit numbers
  - Update label from "所在服务器" to "服务器编号"

### Translations
- `src/i18n/locales/zh.json` + `en.json`
  - Update: "serverName" → "serverId" ("服务器编号" / "Server ID")
  - Add: Platform labels for badges ("Win", "Linux")

## Implementation Plan

### Phase 1: Fix Model Search (Independent)
1. Add `parseModels` utility import if not present
2. Implement `filteredAccounts` computation
3. Update rendering to use filtered list
4. Test with various search terms

### Phase 2: Server Badge Display (Depends on Phase 3)
1. Create badge rendering function
2. Design badge styles (Windows blue, Linux green)
3. Position badges between account ID and name
4. Test responsive layout

### Phase 3: Server ID Data Model (Parallel with Phase 1)
1. Rename `serverName` to `serverId` in interface
2. Add data migration for existing serverName values
3. Ensure backward compatibility

### Phase 4: Numeric Server ID Input (Depends on Phase 3)
1. Create numeric input with spinner controls
2. Implement increment/decrement logic
3. Add zero-padding formatting
4. Update labels

### Phase 5: Translations & Testing
1. Update translation keys
2. Test all features together
3. Verify model search filtering
4. Verify badge display and responsiveness
5. Test server ID increment/decrement

## Risks/Considerations

### Data Migration
- **Risk**: Existing `serverName` values may not be numeric
- **Mitigation**: Migration function converts text to numeric ID:
  - Extract trailing numbers from serverName (e.g., "Server-01" → "001")
  - If no numbers found, assign sequential IDs starting from "001"
  - Store migration mapping for rollback if needed

### Search Performance
- **Risk**: Filtering accounts on every keystroke may impact performance with many accounts
- **Mitigation**: Use `useMemo` with proper dependencies; parsing happens once per account

### Badge Layout
- **Risk**: Multiple badges may crowd the header on small screens
- **Mitigation**: Use flex-wrap and shrink-0 classes; badges stack vertically on mobile

### Server ID Conflicts
- **Risk**: Users might assign duplicate server IDs
- **Mitigation**: Accept duplicates (IDs are labels, not unique keys); consider visual warning in future iteration

## Success Criteria

1. ✅ Model search filters accounts to show only those with matching models
2. ✅ Server badges display between account ID and account name
3. ✅ Server badges styled with platform-specific colors (Windows blue, Linux green)
4. ✅ Server ID stored as numeric string (001, 002, etc.)
5. ✅ Increment/decrement buttons work correctly
6. ✅ Data migration handles existing serverName values
7. ✅ Layout responsive on mobile/desktop
8. ✅ All data persists correctly
