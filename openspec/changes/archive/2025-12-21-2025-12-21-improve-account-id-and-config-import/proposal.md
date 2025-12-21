# Improve Account ID Ordering and Add Config Import

## Why

Currently, the account ID generation has three limitations:

1. **ID Assignment Ignores Sort Order**: Account IDs are assigned based on tier only, not considering the account's position in the list. After manual drag-and-drop reordering, accounts may have IDs that don't match their visual order (e.g., A003, A001, A002 instead of A001, A002, A003).

2. **No Manual Re-numbering**: Users cannot reset account IDs to match current sort order after reordering or deletions.

3. **Import Missing**: Users can export configurations but cannot import them, making backup/restore workflows incomplete.

## What Changes

### 1. Position-Based Account ID Assignment

Update account ID generation to consider **position in the sorted accounts array**:
- Premium accounts: Assigned A001, A002, A003... **in their current order**
- Standard accounts: Assigned B001, B002, B003... **in their current order**
- After drag-and-drop reordering, IDs reflect new positions

### 2. Manual Re-number Button

Add a "重新编号" (Re-number) button in the accounts section header:
- Triggers reassignment of all account IDs based on current sort order
- Shows confirmation dialog before execution
- Useful after deletions or reordering to "clean up" numbering

### 3. Import Configuration Feature

Add "导入配置" (Import Config) button alongside existing Export button:
- Opens file picker for JSON files
- Validates imported configuration structure
- Decrypts sensitive fields (API keys, passwords, SSH keys)
- Merges or replaces current configuration (user choice)
- Shows success/error notifications

## Files Affected

### Account ID Logic
- `src/utils/accountIdGenerator.ts` - Add position-based generation function
- `src/hooks/useLocalAzureAccounts.ts` - Add re-number handler, update ID assignment logic

### UI Components
- `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx` - Add re-number and import buttons
- `src/components/Dashboard/AccountConfiguration/index.ts` - Export new components if needed

### Internationalization
- `src/i18n/locales/zh.json` - Add Chinese translations
- `src/i18n/locales/en.json` - Add English translations

## Implementation Plan

### Phase 1: Position-Based Account IDs

1. **Create Position-Based Generator**:
   ```typescript
   // Generate ID based on position in array
   export function generateAccountIdByPosition(
     accounts: AccountWithIdAndTier[],
     tier: AccountTier,
     position: number
   ): string {
     const prefix = tier === 'premium' ? 'A' : 'B';
     const sameTierAccounts = accounts.filter(a => a.tier === tier);
     const positionInTier = sameTierAccounts.indexOf(accounts[position]);
     return `${prefix}${String(positionInTier + 1).padStart(3, '0')}`;
   }
   ```

2. **Add Re-number Function in Hook**:
   ```typescript
   const renumberAllAccounts = useCallback(() => {
     saveAccounts((prev) => {
       const premiumAccounts = prev.filter(a => a.tier === 'premium');
       const standardAccounts = prev.filter(a => a.tier !== 'premium');

       const renumbered = [
         ...premiumAccounts.map((acct, idx) => ({
           ...acct,
           accountId: `A${String(idx + 1).padStart(3, '0')}`
         })),
         ...standardAccounts.map((acct, idx) => ({
           ...acct,
           accountId: `B${String(idx + 1).padStart(3, '0')}`
         }))
       ];

       return renumbered;
     });
   }, [saveAccounts]);
   ```

3. **Update Migration Logic**:
   - Use position-based assignment in `migrateAccountsToV2`
   - Sort by tier first, then assign sequential IDs

### Phase 2: Manual Re-number Button

1. **Add Button to AccountsSection**:
   - Position: Next to "导出配置" button
   - Icon: 🔢 or similar
   - Click: Show confirmation dialog

2. **Confirmation Dialog**:
   - Message: "确定要重新编号所有账号吗？这将根据当前排序重新分配账号 ID。"
   - Actions: "确认" / "取消"

3. **Wire Up Handler**:
   - Connect button to `renumberAllAccounts` from hook
   - Show toast notification on success

### Phase 3: Import Configuration

1. **Add Import Button to AccountsSection**:
   - Position: Next to "导出配置" button
   - Opens file input dialog
   - Accepts `.json` files

2. **Import Logic in Hook**:
   ```typescript
   const importConfig = useCallback((jsonString: string) => {
     try {
       const parsed = JSON.parse(jsonString);

       // Validate structure
       if (!Array.isArray(parsed)) {
         throw new Error('Invalid config format');
       }

       // Decrypt sensitive fields
       const decrypted = decryptAccounts(parsed);

       // Save to localStorage
       saveAccounts(decrypted);

       return { success: true };
     } catch (error) {
       return { success: false, error: error.message };
     }
   }, [saveAccounts]);
   ```

3. **File Upload Handler**:
   ```typescript
   const handleImportClick = () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = '.json';
     input.onchange = (e) => {
       const file = (e.target as HTMLInputElement).files?.[0];
       if (file) {
         const reader = new FileReader();
         reader.onload = (event) => {
           const result = importConfig(event.target?.result as string);
           if (result.success) {
             toast.success(t('toast.configImported'));
           } else {
             toast.error(t('toast.configImportFailed'));
           }
         };
         reader.readAsText(file);
       }
     };
     input.click();
   };
   ```

## Testing

### Position-Based IDs
1. Create 5 standard accounts → Should get B001-B005
2. Drag B003 to position 1 → After re-number, should become B001
3. Delete B002 → Remaining accounts should be B001, B002, B003 after re-number

### Re-number Button
1. Click re-number button → Should show confirmation
2. Confirm → All IDs should match current visual order
3. Verify premium and standard accounts renumbered separately

### Import Configuration
1. Export config → Download JSON file
2. Clear localStorage
3. Click import → Select exported file
4. Verify all accounts restored with correct IDs
5. Test with invalid JSON → Should show error
6. Test with malformed config → Should show validation error

## Risks/Considerations

### Breaking ID References
- **Risk**: Changing IDs may confuse users who reference them externally
- **Mitigation**: Only apply when user explicitly clicks re-number button; show clear confirmation

### Import Overwrites Data
- **Risk**: Import replaces all data, potential data loss
- **Mitigation**: Show warning dialog before import; consider adding "merge" option in future

### Decryption Compatibility
- **Risk**: Exported configs from different encryption keys won't import
- **Mitigation**: Use consistent encryption key; document this limitation

## Related Specs

- [account-id-prefix](../../specs/account-id-prefix/spec.md) - Account ID generation requirements

## Success Criteria

1. ✅ Account IDs reflect current sort order after re-numbering
2. ✅ Re-number button successfully reassigns all IDs
3. ✅ Import button opens file picker and accepts JSON files
4. ✅ Imported configs are validated and decrypted correctly
5. ✅ Success/error notifications shown for import operations
6. ✅ Existing export functionality still works
