# Tasks

## Implementation

### 1. Update Import Statement
- [x] Open `src/hooks/useLocalAzureAccounts.ts`
- [x] Locate line 5 with existing import: `import { generateAccountId, regenerateAccountId } from '../utils/accountIdGenerator';`
- [x] Add `renumberAccountsByPosition` to the import list

### 2. Remove Dynamic Require
- [x] Navigate to `renumberAllAccounts` function (around line 561-566)
- [x] Remove line 563: `const { renumberAccountsByPosition } = require('../utils/accountIdGenerator');`
- [x] Update line 564 to directly use the imported function

### 3. Verify Changes
- [x] Run `npm run build` to check for TypeScript errors
- [x] Ensure no compilation errors

## Testing

### 4. Manual Browser Testing
- [ ] Start dev server with `npm run dev`
- [ ] Open application in browser
- [ ] Create or view existing accounts
- [ ] Click "重新编号" (Re-number) button
- [ ] Verify no "require is not defined" error appears
- [ ] Verify confirmation dialog shows correctly
- [ ] Confirm re-numbering
- [ ] Verify account IDs are updated correctly (A001, A002... B001, B002...)

### 5. Edge Case Testing
- [ ] Test with no accounts (button shouldn't appear)
- [ ] Test with single account
- [ ] Test with mixed premium and standard accounts
- [ ] Test after drag-and-drop reordering
- [ ] Verify success toast message appears
