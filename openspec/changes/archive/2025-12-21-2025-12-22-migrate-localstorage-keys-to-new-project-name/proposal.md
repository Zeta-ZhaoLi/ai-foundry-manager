# Migrate localStorage Keys to New Project Name

## Why

The project has been renamed from `azure-openai-manager` to `ai-foundry-manager`, but all localStorage keys still use the old project name prefix:

**Current Keys (Outdated):**
- `azure-openai-manager:accounts` - Account configurations
- `azure-openai-manager:master-models` - Global model directory
- `azure-openai-manager:config-history` - Configuration version history
- `azure-openai-manager:theme` - Theme preference
- `azure-openai-manager:audit-log` - Audit log entries
- `azure-openai-manager:lang` - Language preference

**Problems:**
1. **Inconsistency**: package.json, repository URL, and README all reference `ai-foundry-manager`, but localStorage keys still use the old name
2. **User Confusion**: Users inspecting localStorage will see outdated project name
3. **Documentation Mismatch**: README documents the old keys, creating confusion
4. **Brand Inconsistency**: The project name has evolved to better reflect its purpose (AI Foundry management, not just Azure OpenAI)

**Requirements:**
1. Update all localStorage keys to use `ai-foundry-manager:` prefix
2. Maintain backward compatibility - automatically migrate old keys to new keys on first load
3. Preserve all user data during migration (accounts, models, history, preferences)
4. Update documentation to reflect new key names

## What Changes

### 1. Update localStorage Key Constants

**Files to Update:**
- `src/hooks/useLocalAzureAccounts.ts` - `STORAGE_KEY`
- `src/components/AzureModelsDashboard.tsx` - `MASTER_STORAGE_KEY`
- `src/hooks/useConfigHistory.ts` - `STORAGE_KEY`
- `src/contexts/ThemeContext.tsx` - `THEME_STORAGE_KEY`
- `src/hooks/useAuditLog.ts` - `DEFAULT_STORAGE_KEY`
- `src/i18n/index.ts` - `LANG_STORAGE_KEY`

**Change:**
```typescript
// Old
const STORAGE_KEY = 'azure-openai-manager:accounts';

// New
const STORAGE_KEY = 'ai-foundry-manager:accounts';
const LEGACY_STORAGE_KEY = 'azure-openai-manager:accounts'; // For migration
```

### 2. Implement Migration Logic

Each hook/module that reads from localStorage needs migration logic:

```typescript
// Migration pattern (pseudocode)
function migrateStorageKey(oldKey: string, newKey: string) {
  const newData = localStorage.getItem(newKey);

  // If new key already has data, use it (already migrated)
  if (newData !== null) {
    return newData;
  }

  // Check for old key data
  const oldData = localStorage.getItem(oldKey);

  if (oldData !== null) {
    // Migrate: copy old data to new key
    localStorage.setItem(newKey, oldData);
    // Optionally remove old key (we'll keep it for safety)
    // localStorage.removeItem(oldKey);
    return oldData;
  }

  // No data in either key
  return null;
}
```

**Migration Strategy:**
- Run migration on first read attempt in each module
- Copy data from old key to new key
- **Keep old key intact** (don't delete) for safety - users can manually clean up later
- Log migration success to console for transparency

### 3. Update Documentation

**README.md:**
```markdown
// Old
'azure-openai-manager:accounts'       // Account configurations
'azure-openai-manager:master-models'  // Global model directory
'azure-openai-manager:config-history' // Configuration versions

// New
'ai-foundry-manager:accounts'       // Account configurations
'ai-foundry-manager:master-models'  // Global model directory
'ai-foundry-manager:config-history' // Configuration versions
```

### 4. Update Export Filename

**AzureModelsDashboard.tsx:**
```typescript
// Old
link.download = 'azure-openai-manager-config.json';

// New
link.download = 'ai-foundry-manager-config.json';
```

## Files Affected

### Code Changes
1. **src/hooks/useLocalAzureAccounts.ts**
   - Add `LEGACY_STORAGE_KEY` constant
   - Add migration logic in useEffect on first load
   - Update `STORAGE_KEY` to new name

2. **src/components/AzureModelsDashboard.tsx**
   - Add `LEGACY_MASTER_STORAGE_KEY` constant
   - Add migration logic for master models
   - Update `MASTER_STORAGE_KEY` to new name
   - Update export filename

3. **src/hooks/useConfigHistory.ts**
   - Add `LEGACY_STORAGE_KEY` constant
   - Add migration logic on first load
   - Update `STORAGE_KEY` to new name

4. **src/contexts/ThemeContext.tsx**
   - Add `LEGACY_THEME_STORAGE_KEY` constant
   - Add migration logic
   - Update `THEME_STORAGE_KEY` to new name

5. **src/hooks/useAuditLog.ts**
   - Add `LEGACY_STORAGE_KEY` constant
   - Add migration logic
   - Update `DEFAULT_STORAGE_KEY` to new name

6. **src/i18n/index.ts**
   - Add `LEGACY_LANG_STORAGE_KEY` constant
   - Add migration logic
   - Update `LANG_STORAGE_KEY` to new name

### Documentation Changes
7. **README.md**
   - Update localStorage key documentation section
   - Change all references from `azure-openai-manager:` to `ai-foundry-manager:`

## Implementation Plan

### Phase 1: Accounts Storage Migration
1. Update `useLocalAzureAccounts.ts` with new key and migration logic
2. Test migration with existing localStorage data
3. Verify all account data preserved

### Phase 2: Master Models Storage Migration
1. Update `AzureModelsDashboard.tsx` with new key and migration logic
2. Update export filename
3. Test migration and export functionality

### Phase 3: Configuration History Migration
1. Update `useConfigHistory.ts` with new key and migration logic
2. Verify all history versions preserved

### Phase 4: Theme & Preferences Migration
1. Update `ThemeContext.tsx` with new key and migration logic
2. Update `i18n/index.ts` with new key and migration logic
3. Test theme and language persistence

### Phase 5: Audit Log Migration
1. Update `useAuditLog.ts` with new key and migration logic
2. Verify audit log entries preserved

### Phase 6: Documentation Update
1. Update README.md with new key names
2. Verify all references updated

### Phase 7: Testing & Validation
1. Test with fresh browser (no data) - should work normally
2. Test with old keys present - should migrate automatically
3. Test with new keys already present - should use new keys
4. Verify no data loss in any scenario
5. Run production build to ensure no errors

## Risks/Considerations

### Data Loss Risk
- **Risk**: Migration logic bug could cause data loss
- **Mitigation**:
  - Keep old keys intact (don't delete them)
  - Add console logging for migration events
  - Encourage users to export config before updating

### Double Migration
- **Risk**: User loads app twice during migration, causing duplicate data
- **Mitigation**: Check if new key exists first before migrating

### Mixed Key State
- **Risk**: Some keys migrated, some not (partial state)
- **Mitigation**: Each module handles its own migration independently

### Browser Compatibility
- **Risk**: localStorage behavior varies across browsers
- **Mitigation**: Use standard localStorage API, no browser-specific features

## Success Criteria

1. ✅ All 6 localStorage keys updated to `ai-foundry-manager:` prefix
2. ✅ Migration logic added to all 6 modules that use localStorage
3. ✅ Old data automatically migrated to new keys on first load
4. ✅ No data loss during migration (accounts, models, history, preferences preserved)
5. ✅ Console logs confirm successful migration
6. ✅ README documentation updated with new key names
7. ✅ Export filename updated to match new project name
8. ✅ Application works for both fresh installs and migrated users
9. ✅ Production build successful
10. ✅ All existing features continue working after migration

## Questions for User

None - the requirements are clear:
1. Rename keys from `azure-openai-manager:` to `ai-foundry-manager:`
2. Maintain backward compatibility with automatic migration
3. Preserve all existing user data
