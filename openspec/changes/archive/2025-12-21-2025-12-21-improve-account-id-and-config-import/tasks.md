# Tasks

## Phase 1: Position-Based Account IDs

### 1.1 Update Account ID Generator
- [ ] Add `generateAccountIdsByPosition()` function to `src/utils/accountIdGenerator.ts`
- [ ] Function should assign IDs based on array position, not gap-filling
- [ ] Premium accounts get A001, A002, A003... in order
- [ ] Standard accounts get B001, B002, B003... in order

### 1.2 Add Re-number Handler to Hook
- [ ] Add `renumberAllAccounts()` function in `src/hooks/useLocalAzureAccounts.ts`
- [ ] Separate premium and standard accounts
- [ ] Assign sequential IDs based on current order
- [ ] Export handler from hook

### 1.3 Update Migration Logic
- [ ] Update `migrateAccountsToV2()` to use position-based assignment
- [ ] Ensure initial migration assigns IDs based on order

## Phase 2: Manual Re-number Button

### 2.1 Add UI Button
- [ ] Add "重新编号" button to `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx`
- [ ] Position next to "导出配置" button
- [ ] Use 🔢 icon or appropriate styling

### 2.2 Add Confirmation Dialog
- [ ] Create or reuse confirmation dialog component
- [ ] Show warning message about ID reassignment
- [ ] Wire up "confirm" to call `renumberAllAccounts()`

### 2.3 Wire Up Handler
- [ ] Connect button click to confirmation dialog
- [ ] Pass `renumberAllAccounts` handler from hook
- [ ] Show success toast after re-numbering

### 2.4 Add Translations
- [ ] Add "重新编号" to `zh.json`
- [ ] Add "Re-number Accounts" to `en.json`
- [ ] Add confirmation dialog messages

## Phase 3: Import Configuration

### 3.1 Add Import Handler to Hook
- [ ] Add `importConfig()` function in `src/hooks/useLocalAzureAccounts.ts`
- [ ] Accept JSON string parameter
- [ ] Validate config structure (must be array)
- [ ] Decrypt sensitive fields using existing `decryptAccounts()`
- [ ] Save to localStorage
- [ ] Return success/error result
- [ ] Export handler from hook

### 3.2 Add Import Button to UI
- [ ] Add "导入配置" button to `AccountsSection.tsx`
- [ ] Position next to "导出配置" button
- [ ] Wire up file input handler
- [ ] Accept `.json` files only

### 3.3 File Upload Handler
- [ ] Create hidden file input element
- [ ] Trigger click on button press
- [ ] Read file as text using FileReader
- [ ] Call `importConfig()` with file contents
- [ ] Show success/error toast based on result

### 3.4 Add Translations
- [ ] Add "导入配置" to `zh.json`
- [ ] Add "Import Config" to `en.json`
- [ ] Add import success/error messages

## Phase 4: Testing and Validation

### 4.1 Build and Verify
- [ ] Run `npm run build` to check for TypeScript errors
- [ ] Verify bundle size remains reasonable

### 4.2 Manual Testing - Position-Based IDs
- [ ] Create 5 standard accounts, verify B001-B005
- [ ] Drag B003 to top, click re-number, verify becomes B001
- [ ] Delete middle account, re-number, verify sequential IDs

### 4.3 Manual Testing - Re-number Button
- [ ] Click re-number button, verify confirmation dialog
- [ ] Confirm, verify all IDs match visual order
- [ ] Test with mixed premium/standard accounts

### 4.4 Manual Testing - Import
- [ ] Export config to JSON file
- [ ] Clear localStorage
- [ ] Import the exported file
- [ ] Verify all accounts restored correctly
- [ ] Test with invalid JSON, verify error message
- [ ] Test with malformed config, verify validation

### 4.5 Edge Cases
- [ ] Test import with empty file
- [ ] Test import with non-JSON file
- [ ] Test re-number with no accounts
- [ ] Test re-number with single account
