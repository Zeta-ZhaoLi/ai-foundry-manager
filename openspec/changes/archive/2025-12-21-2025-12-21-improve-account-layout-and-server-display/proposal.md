# Improve Account Layout and Server Display

## Why

Several UX improvements are needed for the account management interface:

1. **Account ID visibility**: The account ID (A001, B001, etc.) is currently shown after the tier selector, making it invisible when accounts are collapsed. Users need to see account IDs at a glance without expanding.

2. **Expand/Collapse button position shift**: The expand button moves position when toggling between expanded/collapsed states, requiring mouse repositioning for repeated expand/collapse operations.

3. **Server location tracking**: Users need a quick way to see which physical server (Windows/Linux) each account is deployed on without expanding the server login sections. This information should be visible in the collapsed state.

4. **Visual alignment**: Empty fields should maintain consistent spacing for vertical scanning across multiple accounts.

5. **Summary views incomplete**: The Account Summary and Model Overview sections don't display server location information, making it hard to see deployment topology at a glance.

## What Changes

### 1. Account Card Layout Redesign

**Current Layout (Collapsed):**
```
[Tier Selector] [Account ID Badge]
[Account Name Input]
[Expand Button] → moves to different position
```

**New Layout (Collapsed):**
```
[Account ID Badge] [Account Name] [Server: Linux/Windows] [Expand Button (fixed position)]
```

**Changes:**
- Move account ID badge to the leftmost position in the collapsed view header
- Display server location label after account name (e.g., "服务器: Windows/Linux/Both/未配置")
- Fix expand/collapse button to a consistent position (rightmost in header)
- Maintain placeholder spacing when server info is empty

### 2. Server Location Display

Add a new field to ServerCredentials interface:
```typescript
export interface ServerCredentials {
  host: string;
  username: string;
  password?: string;
  sshKey?: string;
  port?: number;
  note?: string;
  serverName?: string;  // NEW: Physical server identifier
}
```

The `serverName` field represents the physical server machine name or label, allowing users to track which server host each account is configured on (e.g., "Main-Server-01", "Backup-API-Host").

### 3. Account Summary Enhancement

Add server columns to the Account Summary table:
```
| Account ID | Account Name | Windows Server | Linux Server | Regions | Models |
```

Show server names or "未配置" when empty, maintaining column alignment.

### 4. Model Overview Enhancement

Add "部署服务器" column showing which Linux API server each model is deployed on:
```
| Model | Accounts | Coverage | 部署服务器 (Linux) |
```

This shows the Linux server name(s) where API endpoints for each model are hosted.

## Files Affected

### Core Data Types
- `src/hooks/useLocalAzureAccounts.ts`
  - Add `serverName` field to `ServerCredentials` interface
  - Update handlers to preserve `serverName` in updates

### Account Card UI
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`
  - Redesign collapsed header layout
  - Move account ID badge to leftmost position
  - Add server location summary display
  - Fix expand/collapse button position
  - Add `serverName` input fields to server login sections
  - Maintain placeholder spacing for empty fields

### Summary Views
- `src/components/Dashboard/Summary/AccountSummary.tsx`
  - Add server name columns
  - Update `AccountSummaryItem` interface to include server info
  - Maintain alignment with empty placeholders

- `src/components/Dashboard/ModelOverviewTable.tsx`
  - Add "部署服务器" column
  - Map models to their Linux server locations
  - Show server names in new column

### Translations
- `src/i18n/locales/zh.json` + `en.json`
  - Add translations for server name labels
  - Add "部署服务器" / "Deployment Server"
  - Add "所在服务器" / "Server Location"

## Implementation Plan

### Phase 1: Data Model (Parallel with Phase 2)
1. Update `ServerCredentials` interface with `serverName` field
2. Update all server update handlers to preserve `serverName`
3. Ensure backward compatibility (existing data without `serverName`)

### Phase 2: Account Card Layout (Parallel with Phase 1)
1. Redesign collapsed header layout
   - Move account ID badge to start of header
   - Add server location summary (Windows/Linux/Both/未配置)
   - Position expand/collapse button at fixed rightmost location
2. Add server name input fields in server login sections
3. Implement placeholder spacing for empty fields

### Phase 3: Summary Views
1. Update `AccountSummary` component
   - Add Windows/Linux server columns
   - Update data interface
   - Implement empty placeholder alignment
2. Update `ModelOverviewTable` component
   - Add "部署服务器" column
   - Map models to Linux server names
   - Handle multiple servers per model

### Phase 4: Translations & Testing
1. Add all translation keys
2. Test layout with various data states (empty, partial, complete)
3. Verify visual alignment across multiple accounts
4. Test expand/collapse button UX

## Risks/Considerations

### Data Migration
- **Risk**: Existing accounts don't have `serverName` field
- **Mitigation**: Make field optional, show "未配置" placeholder for backward compatibility

### Layout Complexity
- **Risk**: Collapsed header may become crowded on small screens
- **Mitigation**: Use responsive grid layout with wrapping on mobile

### Server Name Source of Truth
- **Risk**: Users might enter inconsistent server names (typos, variations)
- **Mitigation**: Accept free-form input initially; consider dropdown with suggestions in future iteration

### Performance
- **Risk**: Adding columns to Model Overview table may impact rendering
- **Mitigation**: Virtual scrolling already in place, minimal impact expected

## Success Criteria

1. ✅ Account ID visible in collapsed state at leftmost position
2. ✅ Expand/collapse button stays in fixed position (no mouse movement needed)
3. ✅ Server location visible in collapsed account header
4. ✅ Empty fields maintain spacing for vertical alignment
5. ✅ Account Summary shows Windows/Linux server names
6. ✅ Model Overview shows deployment server (Linux) column
7. ✅ All data persists correctly with backward compatibility
8. ✅ Responsive layout works on mobile/desktop
