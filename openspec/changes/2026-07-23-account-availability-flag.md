# Account Availability Flag

## Summary

Add a persistent account-level availability flag for operators to mark an
Azure account as ready for model calls after deployment has completed.

## Motivation

New Azure accounts may require one to five days after resource deployment
before the main models can be used. The dashboard needs a separate manual
status that records this operational fact without changing model selection,
statistics, account collapse behavior, or deployment configuration.

## Files Affected

- `src/schemas/account.ts` and `src/persistence/config.ts` - Add the field and
  default missing historical values to `false`.
- `src/hooks/useLocalAzureAccounts.ts` and account configuration components -
  Persist the update and render the checkbox beside the existing account flags.
- `src/i18n/locales/*.json` - Add the localized availability label.

## Implementation Plan

1. Add `available: boolean` with a `false` schema default and initialize new
   accounts as unavailable.
2. Normalize legacy accounts, imports, and deployment-result-created accounts
   to unavailable when the field is absent.
3. Add an account update callback through the dashboard and render the
   checkbox immediately before `includeInStats`.
4. Keep all existing account, region, model, statistics, and deployment logic
   independent of this marker.

## Testing

- Verify schema and storage migration defaults, round-trip persistence, and
  deployment-result import behavior.
- Verify hook updates only the selected account.
- Verify checkbox order, default state, callback wiring, and unchanged sibling
  flags across the supported locales.
- Run `npm run verify`.

## Risks/Considerations

- The flag is intentionally manual and is not inferred from API keys, model
  lists, or deployment reports.
- Configuration version remains `2`; no backend or vault storage is added.
