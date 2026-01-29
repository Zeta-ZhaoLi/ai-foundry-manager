# Tasks

## Phase 1: Remove Global Summary

- [x] Remove Global Summary panel from `src/components/AzureModelsDashboard.tsx`
- [x] Remove or archive unused GlobalSummary component usage (optional)
- [x] Update specs to remove Global Summary requirements/scenarios

## Phase 2: Expand Master Directory Copy Actions

- [x] Compute deployed model set/list from enabled accounts + enabled regions
- [x] Add directory-level copy buttons: "All" and "Deployed"
- [x] Add per-group copy buttons: "All" and "Deployed"
- [x] Ensure copied output includes commas and follows directory ordering
- [x] Update i18n strings
- [x] Add unit tests for copy selection and ordering

## Phase 3: Model Deployment Count Badges

- [x] Compute per-model deployed region counts (enabled accounts + enabled regions)
- [x] Display a small count badge on each model chip in the Global Model Directory list
- [x] Add/adjust i18n strings and tooltips if needed

## Phase 4: Account ID Display in Tables

- [x] Update model overview/statistics "deployed accounts" display to show accountId (A/B-prefixed) instead of numeric indices
- [x] Add an Account ID column to the account overview table
- [x] Update specs for model-account-id-display to match accountId semantics
- [x] Add tests for accountId mapping where appropriate

## Phase 5: Validation

- [x] Run `npm run test`
- [x] Run `npm run lint`
- [x] Run `npm run build`
