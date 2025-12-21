# Tasks

## Phase 1: Accounts Storage Migration
- [x] Update STORAGE_KEY constant in useLocalAzureAccounts.ts
- [x] Add LEGACY_STORAGE_KEY constant
- [x] Implement migration logic in useEffect
- [x] Add console logging for migration events
- [x] Test migration with existing localStorage data
- [x] Verify all account data preserved (regions, models, credentials)

## Phase 2: Master Models Storage Migration
- [x] Update MASTER_STORAGE_KEY constant in AzureModelsDashboard.tsx
- [x] Add LEGACY_MASTER_STORAGE_KEY constant
- [x] Implement migration logic on component mount
- [x] Update export filename from azure-openai-manager-config.json to ai-foundry-manager-config.json
- [x] Test migration and verify master models preserved
- [x] Test export functionality with new filename

## Phase 3: Configuration History Migration
- [x] Update STORAGE_KEY constant in useConfigHistory.ts
- [x] Add LEGACY_STORAGE_KEY constant
- [x] Implement migration logic
- [x] Test migration with existing history data
- [x] Verify all history versions preserved (up to 20 versions)

## Phase 4: Theme Storage Migration
- [x] Update THEME_STORAGE_KEY constant in ThemeContext.tsx
- [x] Add LEGACY_THEME_STORAGE_KEY constant
- [x] Implement migration logic in useEffect
- [x] Test theme persistence across app reloads
- [x] Verify dark/light/system theme settings preserved

## Phase 5: Language Storage Migration
- [x] Update LANG_STORAGE_KEY constant in i18n/index.ts
- [x] Add LEGACY_LANG_STORAGE_KEY constant
- [x] Implement migration logic
- [x] Test language preference persistence
- [x] Verify Chinese/English selection preserved

## Phase 6: Audit Log Storage Migration
- [x] Update DEFAULT_STORAGE_KEY constant in useAuditLog.ts
- [x] Add LEGACY_STORAGE_KEY constant
- [x] Implement migration logic
- [x] Test audit log entries preservation
- [x] Verify all historical audit entries accessible

## Phase 7: Documentation Updates
- [x] Update README.md localStorage section with new key names
- [x] Replace all azure-openai-manager: references with ai-foundry-manager:
- [x] Verify documentation accuracy

## Phase 8: Integration Testing
- [x] Test scenario: Fresh browser with no existing data
  - Verify app works normally with new keys
- [x] Test scenario: Existing user with old keys only
  - Verify automatic migration occurs
  - Verify all data preserved
  - Verify console logs show migration success
- [x] Test scenario: User with new keys already present
  - Verify app uses new keys
  - Verify no duplicate migration
- [x] Test scenario: Mixed state (some old, some new keys)
  - Verify each module migrates independently
  - Verify no conflicts or data loss

## Phase 9: Build & Validation
- [x] Run npm run build
- [x] Verify no TypeScript errors
- [x] Verify no console errors in dev mode
- [x] Run production build preview
- [x] Test migration in production build

## Dependencies
- Phase 1-6 can be done in parallel (independent modules)
- Phase 7 depends on Phase 1-6 (documentation matches implementation)
- Phase 8 depends on Phase 1-7 (integration testing requires all changes)
- Phase 9 depends on Phase 8 (final validation)
