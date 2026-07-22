# Group Consecutive Disabled Accounts

## Summary

Replace long consecutive runs of accounts with disabled model participation by a single expandable range row. Account number families such as A and B are grouped separately.

## Motivation

Individually collapsed account cards still consume one row per account and do not reduce the length of large account lists. Operators need a compact summary that shows the covered account-number range and count.

## Files Affected

- `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx` - Build typed disabled-account runs and render expandable summary rows.
- `src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx` - Cover run boundaries, account prefixes, and persistent manual expansion.
- `src/i18n/locales/*.json` - Add range-summary text for all supported languages.

## Implementation Plan

1. Partition the premium-first displayed account order into account rows and disabled-account runs.
2. Split runs whenever an enabled account or a different account-number prefix is encountered.
3. Convert runs of at least three accounts into one summary row showing first ID, last ID, and account count.
4. Keep summary rows collapsed by default and preserve manual expansion state across rerenders.
5. Render model-search matches as individual accounts so search results remain actionable.

## Testing

- Verify two disabled accounts remain individual rows.
- Verify three or more disabled accounts become one group.
- Verify A and B IDs never share a group.
- Verify enabled accounts split runs.
- Verify expanding and collapsing a group persists across rerenders.

## Risks/Considerations

- Collapsed group rows are not draggable; their account cards become draggable after expansion.
- Account IDs without a leading-letter-and-number form remain individual rows.
