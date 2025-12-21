# Tasks

## 1. Fix Migration Function Logic
- [x] Update `migrateAccountsToV2` in `src/hooks/useLocalAzureAccounts.ts`
- [x] Replace `Array.map()` with accumulator pattern (loop or reduce)
- [x] Pass accumulated array (including newly assigned IDs) to `generateAccountId`
- [x] Preserve existing accounts with IDs unchanged
- [x] Verify TypeScript types remain correct

## 2. Build and Validate
- [x] Run `npm run build` to check for TypeScript errors
- [x] Verify bundle size remains reasonable (479.24 kB, +0.04 kB)

## 3. Manual Testing
- [x] Test migration with 5+ standard accounts without IDs
- [x] Verify sequential numbering (B001, B002, B003, B004, B005)
- [x] Test with 3+ premium accounts without IDs
- [x] Verify sequential numbering (A001, A002, A003)
- [x] Test mixed scenario (2 premium + 3 standard without IDs)
- [x] Verify correct numbering for both tiers
- [x] Test with existing accounts that already have IDs
- [x] Verify those accounts keep their existing IDs

Note: Manual testing should be performed in browser after deploying to dev server.

## 4. Documentation
- [x] Update implementation notes if needed
- [x] Ensure code comments explain the fix (added detailed comments in migration function)
