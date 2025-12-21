# Fix "require is not defined" Error in Re-number Function

## Why

The re-number button causes a runtime error: "require is not defined". This error occurs in the browser because `renumberAllAccounts` function in `useLocalAzureAccounts.ts` uses Node.js's `require()` syntax to dynamically import `renumberAccountsByPosition`:

```typescript
const renumberAllAccounts = useCallback(() => {
  saveAccounts((prev) => {
    const { renumberAccountsByPosition } = require('../utils/accountIdGenerator'); // ❌ Breaks in browser
    return renumberAccountsByPosition(prev) as LocalAccount[];
  });
}, [saveAccounts]);
```

The `require()` function doesn't exist in browser environments - only ES6 `import` statements work after bundling with Vite.

## What Changes

Replace the dynamic `require()` with a static ES6 import at the top of the file:

**Before:**
```typescript
// Line 5
import { generateAccountId, regenerateAccountId } from '../utils/accountIdGenerator';

// Line 563 (inside function)
const { renumberAccountsByPosition } = require('../utils/accountIdGenerator');
```

**After:**
```typescript
// Line 5
import { generateAccountId, regenerateAccountId, renumberAccountsByPosition } from '../utils/accountIdGenerator';

// Line 563 (inside function - just use it)
return renumberAccountsByPosition(prev) as LocalAccount[];
```

## Files Affected

- `src/hooks/useLocalAzureAccounts.ts`
  - Line 5: Add `renumberAccountsByPosition` to existing import
  - Line 563: Remove `require()` and use imported function directly

## Implementation Plan

1. **Update Import Statement**
   - Add `renumberAccountsByPosition` to the import from `'../utils/accountIdGenerator'` (line 5)

2. **Simplify Function Body**
   - Remove the `require()` line from `renumberAllAccounts` (line 563)
   - Directly call `renumberAccountsByPosition(prev)`

3. **Testing**
   - Run `npm run build` to verify TypeScript compilation
   - Test re-number button in browser to confirm error is fixed
   - Verify account IDs are renumbered correctly

## Risks/Considerations

### Minimal Risk
- This is a straightforward import fix with no logic changes
- The function `renumberAccountsByPosition` is already exported and tested
- No data transformation or algorithm changes involved

## Success Criteria

1. ✅ TypeScript compiles without errors
2. ✅ Re-number button works without "require is not defined" error
3. ✅ Account IDs are correctly renumbered based on position
4. ✅ No console errors in browser
