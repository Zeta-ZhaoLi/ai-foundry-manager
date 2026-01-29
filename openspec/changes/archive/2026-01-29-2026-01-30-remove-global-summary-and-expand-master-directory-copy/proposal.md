# Remove Global Summary and Expand Master Directory Copy Actions

## Why

1. The bottom "Global Model Summary" section is redundant once the Global Model Directory is the primary source of truth.
2. Users need copy outputs aligned to two audiences:
   - the directory authoring view (all parsed models)
   - the operational view (models actually deployed/selected in enabled accounts)
3. Copy actions should support both whole-directory and per-group outputs.

## What Changes

### 1) Remove Bottom Global Model Summary

- Remove the Global Summary panel rendered at the bottom of the dashboard.
- Remove its spec requirement from `master-model-directory-grouping`.

### 2) Master Model Directory: Four Copy Variants

Replace the single "copy directory list" button with the following copy options:

1. **Copy Directory List (All)**
   - Copy all parsed models from the master directory.
   - Output must include trailing commas (current `buildCopyString` default behavior is acceptable).
2. **Copy Directory List (Deployed)**
   - Copy the union of models that are deployed/selected under all **enabled accounts** and **enabled regions**.
   - Ordering should follow the master directory order (models not in directory appended after).
3. **Copy This Group (All)**
   - Copy all parsed models in that group.
4. **Copy This Group (Deployed)**
   - Copy only the deployed/selected models that belong to that group.

Notes:

- "Group" refers to blank-line blocks in the master directory.
- The UI may implement these as:
  - two directory-level buttons (All / Deployed)
  - two per-group buttons (All / Deployed)
    This yields exactly the four copy variants requested.

## Definitions

### Deployed Models

"Deployed" means:

- All models present in `modelsText` across all accounts where `account.enabled !== false`
- and regions where `region.enabled !== false`

This matches existing computation used by coverage/stats.

## Additional UI Changes

### 3) Model Deployment Count Badges in Master Directory

- In the Global Model Directory list, each model chip MUST show a small circular badge (message-bubble style) indicating how many enabled regions have deployed/selected that model.
- The count is computed across all enabled accounts and enabled regions.

### 4) Use Account IDs in Model Deployment Displays

- In the model overview/statistics area, the "deployed accounts" display MUST show account IDs (e.g. `A017`, `B030`) instead of numeric indices.
- In the account overview table, add an "Account ID" column.

## Files Affected (Expected)

- `src/components/AzureModelsDashboard.tsx` (remove `<GlobalSummary/>`; compute deployed model set for copy)
- `src/components/Dashboard/MasterModelDirectory.tsx` (new copy buttons and group-level deployed copy)
- `src/components/Dashboard/ModelStatisticsTable.tsx` (show deployed accounts as accountId values)
- `src/components/Dashboard/ModelOverviewTable.tsx` (add accountId column)
- `src/components/Dashboard/Summary/GlobalSummary.tsx` (likely becomes unused; optional cleanup)
- `src/i18n/locales/zh.json`, `src/i18n/locales/en.json` (new copy labels; optionally retire summary strings)
- `openspec/specs/master-model-directory-grouping/spec.md` (remove/adjust Global Summary requirement and scenarios)

## Implementation Plan

1. Remove Global Summary panel from the dashboard composition.
2. Add a helper to compute deployed model set/list (reusing existing `globalSeriesSummary.allModels` or equivalent).
3. Update Master Model Directory UI:
   - Directory-level copy buttons: All / Deployed
   - Group-level copy buttons: All / Deployed
4. Update i18n strings.
5. Add model deployment count badges to each model chip in the directory list.
6. Update model deployment displays to use accountId instead of numeric indices.
7. Add unit tests for copy selection and ordering, plus count/badge mapping.
8. Run `npm run test`, `npm run lint`, `npm run build`.

## Risks / Considerations

- Removing Global Summary also removes its existing "copy all" affordance; the new "Copy Directory List (Deployed)" is intended to replace that workflow.
- Deployed models may include items not in the master directory; those will be appended after directory-ordered models.
