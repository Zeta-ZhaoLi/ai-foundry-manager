# Remove Server Login Info and Reshape Master Model Groups

## Why

1. **Server login info is deprecated**: The project currently supports storing Windows/Linux server login parameters per account (and displaying them in the account card). This parameter set is no longer used and should be removed to reduce surface area and sensitive-data handling.

2. **Current model classification is no longer desired**: The global model list and selection UIs currently group models into three fixed categories (standard / Sora / Claude) based on model ID prefixes. The requested workflow is to let the user define grouping directly in the Global Model Directory text.

3. **Ordering should follow the directory**: Today the Global Model Directory is parsed and then sorted (alphabetical). The requested ordering is the manual order the user enters in the directory.

## What Changes

### 1. Remove Server Login Parameters (Windows/Linux)

**New behavior:**

- Account cards no longer show the "Server Login Information" section.
- The configuration data model no longer persists `windowsServer` / `linuxServer` fields.
- Import accepts legacy configs that contain server fields but ignores/discards them.
- Export no longer includes server login fields.

**Compatibility:**

- Existing localStorage data that contains `windowsServer` / `linuxServer` will be treated as legacy and removed via migration/normalization.

### 2. Group Models by Blank-Line Blocks in Global Model Directory

**New behavior:**

- The Global Model Directory text is parsed into **groups** separated by one (or more) blank lines.
- Each group is rendered as a separate "category" in the model list UI.
- The previous fixed categories (standard / Sora / Claude) are removed from all UIs.

### 3. Preserve Manual Ordering

**New behavior:**

- Model ordering follows the sequence in the Global Model Directory (stable, first-appearance wins).
- Any UI list that uses the master directory as its source (directory chips, region model picker lists, global summary model lists) uses this order by default.

## Files Affected (Expected)

### Remove server login info

- `src/components/Dashboard/AccountConfiguration/AccountCard.tsx` (remove server login UI section)
- `src/components/Dashboard/AccountConfiguration/AccountsSection.tsx` (remove server update plumbing if present)
- `src/hooks/useLocalAzureAccounts.ts` (remove server fields, encryption/decryption paths, import/export/migration handling)
- `src/i18n/locales/zh.json` and `src/i18n/locales/en.json` (remove/retire server-login related strings)
- `openspec/specs/server-login-info/spec.md` (spec update via this change)
- `openspec/specs/server-badge-display/spec.md` (spec update via this change)

### Master directory grouping and ordering

- `src/components/AzureModelsDashboard.tsx` (master directory parsing; remove alphabetical sort)
- `src/components/Dashboard/MasterModelDirectory.tsx` (render grouped list below textarea)
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` (replace 3-category grouping with directory-defined groups)
- `src/components/Dashboard/Summary/GlobalSummary.tsx` (replace 3-category summary with directory-defined groups)
- `src/utils/modelSeries.ts` (remove legacy 3-category model grouping helpers)
- `src/utils/common.ts` (add/adjust parsing utilities as needed)
- `src/i18n/locales/zh.json` and `src/i18n/locales/en.json` (remove/retire `modelCategory.*` strings; add group-related strings if needed)

## Implementation Plan

1. **Delete server login UI and state wiring**
   - Remove the account-card server section and any handlers.
   - Remove server badge display if it depends on the deprecated server fields.

2. **Data model cleanup + backward compatibility**
   - Remove `windowsServer` / `linuxServer` from persisted account shape.
   - On load/import, strip legacy server fields.
   - Ensure export does not include server login info.

3. **Introduce grouped master directory parsing**
   - Parse the master directory text into ordered groups separated by blank lines.
   - Produce two derived views:
     - `groups: string[][]` (for rendering)
     - `allModelsOrdered: string[]` (flattened, stable order)

4. **Replace fixed model categories across the UI**
   - Region model picker: display groups from the master directory; keep filtering behavior; implement "select this group" based on group membership.
   - Global summary: display groups from the master directory (or a single group if none defined).

5. **Update translations**
   - Remove/retire server-login and modelCategory labels.
   - Add minimal new strings for group display if headers/actions are needed.

6. **Validation and tests**
   - Unit tests for grouping + ordering parser.
   - Integration tests for region model selection using grouped directory.
   - Run `npm run test`, `npm run lint`, `npm run build`.

## Risks / Considerations

- **Legacy configs**: Users may have stored server login info; this change intentionally removes it. Migration must be non-destructive to other account fields.
- **Duplicate models across groups**: The parser will de-duplicate by first appearance to avoid rendering the same selectable model multiple times.
- **UX for unnamed groups**: Blank-line groups have no explicit names; the UI may need an ordinal label (e.g., "Group 1") to support actions like "Select group".
