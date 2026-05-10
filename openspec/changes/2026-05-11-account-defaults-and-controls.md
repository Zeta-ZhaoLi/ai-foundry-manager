# Account Defaults and Fixed Account Controls

## Summary
New accounts start disabled, use a $1,000 quota, and include East US 2, Sweden Central, and Poland Central regions by default. Account-level actions remain visible whether an account is expanded or collapsed.

## Motivation
The account list should make it easy to stage accounts without immediately including them in model coverage, while still keeping core actions available from the collapsed row.

## Files Affected
- `src/hooks/useLocalAzureAccounts.ts` - Update new-account defaults.
- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` - Keep account controls fixed and render detail content only when expanded.
- `src/hooks/__tests__/useLocalAzureAccounts.test.tsx` - Cover new-account defaults.
- `src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx` - Cover collapsed account controls.

## Implementation Plan
1. Add default account region and quota helpers.
2. Change `addAccount` to create disabled accounts with three enabled default regions and `$1,000` quota.
3. Remove the disabled/collapsed early return from `AccountCard`.
4. Render controls in the requested order: delete account, include in stats, enable models, expand/collapse.
5. Expand accounts when enabling them and collapse accounts when disabling them.

## Testing
- `tsc --noEmit`
- `eslint src --ext .ts,.tsx`
- Focused Vitest tests when local Rollup optional dependencies allow Vitest to start.

## Risks/Considerations
Existing persisted accounts are left unchanged. The new defaults only apply to accounts created after this change.
