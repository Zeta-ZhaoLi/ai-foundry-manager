# Default Region Model Template

## Summary
Add a collapsible template editor in the Azure account configuration section for default region model selections. The template controls the regions and optional model lists used when creating new accounts.

## Motivation
Users repeatedly create accounts with the same initial regions and model selections. A reusable template reduces manual setup while keeping existing accounts unchanged.

## Files Affected
- `src/hooks/useLocalAzureAccounts.ts` - Store template config and apply it when adding accounts.
- `src/components/Dashboard/AccountConfiguration/*` - Add template editor UI and shared model selector.
- `src/components/AzureModelsDashboard.tsx` - Wire template state and include it in import/export.

## Implementation Plan
1. Add `DefaultRegionModelTemplate` and `DefaultRegionModelTemplateConfig` types.
2. Persist template config in `localStorage` using a dedicated key.
3. Apply the template only when creating new accounts.
4. Extract the region model selection UI into a reusable component.
5. Add a collapsible template panel above the model search input in the account configuration section.
6. Extend config import/export with `defaultRegionModelTemplate` while keeping old formats compatible.

## Testing
- Verify default template initialization and new-account template application.
- Verify disabled template creates the template regions with empty model lists.
- Verify template region add/delete/rename/reorder and model selection actions.
- Verify config import/export includes and restores the template.

## Risks/Considerations
Existing accounts are not migrated or overwritten. If the template region list is empty, newly created accounts will also have no default regions.
