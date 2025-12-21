# Fix Account ID Duplicate Bug in Migration

## Why

The account ID migration logic has a critical bug causing duplicate IDs for standard (B-series) accounts. When migrating existing accounts without IDs, the `migrateAccountsToV2` function uses `Array.map()` which processes each account in isolation. Each iteration calls `generateAccountId(accounts, tier)` with the original accounts array, which doesn't include the newly assigned IDs from previous iterations.

**Current Behavior:**
- Account 1 (standard): sees no B-IDs → assigned B001
- Account 2 (standard): **still** sees no B-IDs → assigned B001 ❌ (duplicate!)
- Account 3 (standard): **still** sees no B-IDs → assigned B002 ❌ (wrong number!)

This bug affects all accounts created before the account ID feature was implemented, causing ID collisions and incorrect numbering.

## What Changes

Fix the `migrateAccountsToV2` function in `src/hooks/useLocalAzureAccounts.ts` to use an accumulator pattern that tracks previously assigned IDs during migration.

**Proposed Solution:**
Replace the functional `map()` with a `reduce()` accumulator or use a traditional loop that maintains state:

```typescript
const migrateAccountsToV2 = useCallback((accounts: LocalAccount[]): LocalAccount[] => {
  const migrated: LocalAccount[] = [];

  for (const acct of accounts) {
    if (!acct.accountId) {
      const tier = acct.tier || 'standard';
      // Pass migrated array which includes previously assigned IDs
      const accountId = generateAccountId(migrated, tier);
      migrated.push({ ...acct, accountId });
    } else {
      migrated.push(acct);
    }
  }

  return migrated;
}, []);
```

This ensures each account sees the IDs assigned to all previous accounts in the migration batch.

## Files Affected

- `src/hooks/useLocalAzureAccounts.ts` - Fix migration function (lines 123-132)

## Implementation Plan

1. **Update Migration Logic** (Spec: account-id-prefix)
   - Replace `Array.map()` with accumulator pattern in `migrateAccountsToV2`
   - Ensure newly assigned IDs are visible to subsequent iterations
   - Maintain existing error handling and type safety

2. **Testing**
   - Test with 5+ standard accounts without IDs
   - Verify sequential numbering (B001, B002, B003, B004, B005)
   - Test mixed scenarios (premium + standard accounts)
   - Verify existing accounts with IDs are not affected

## Risks/Considerations

### Data Consistency
- **Risk**: Users who already have duplicate IDs will need re-migration
- **Mitigation**: The fix only affects accounts without IDs; existing duplicates remain but won't reproduce on new imports

### Migration Side Effects
- **Risk**: Changing migration logic might affect performance
- **Mitigation**: The new logic is still O(n) complexity, just with explicit accumulator tracking

## Related Specs

- [account-id-prefix](../../specs/account-id-prefix/spec.md) - Account ID generation and uniqueness requirements

## Success Criteria

1. ✅ Migration assigns unique sequential IDs to all standard accounts
2. ✅ No duplicate account IDs after migration
3. ✅ Correct numbering sequence (B001, B002, B003, ...)
4. ✅ Premium accounts (A-series) also work correctly
5. ✅ Existing accounts with IDs are not affected
6. ✅ Mixed tier scenarios work properly
