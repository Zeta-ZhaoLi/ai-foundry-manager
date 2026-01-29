# Preserve Model Lines in Grouping and Export Full Deployment Code

## Why

1. **Model groups need an additional "line" layer**: Users maintain the Global Model Directory as multi-line text. Today, within a group, line breaks are treated like any whitespace and are not preserved. The desired behavior is:
   - No blank line between two lines => same group
   - A blank line between lines => different groups
   - Even within the same group, the Region model picker should render models _by input line_.

2. **Global model summary should reflect the same grouping**: The bottom Global Summary should follow group boundaries (and ideally the line breaks inside each group) so the overview is consistent with the directory.

3. **Deployment UX should produce a complete template output**: The current Portal-based "one-click deploy" flow (copy template + download + open portal) should be replaced with a one-click copy of the complete deployment code based on `mainTemplate.json`.

## What Changes

### A) Grouping: Keep Blank-Line Groups, Preserve Line Layout

**Input interpretation**

- Lines separated by a single newline (no blank line) belong to the same group.
- One or more blank lines split groups.
- Within a line, models may still be separated by commas/spaces/tabs.

**UI changes**

- Region model picker:
  - Still groups models by blank-line blocks.
  - Within each group, render models in rows that match the directory's input lines.
- Global summary (bottom):
  - Render by group.
  - Within each group, optionally render by lines (recommended) for readability.

**Data/utility changes**

- Extend master directory parsing to return:
  - group-level model lists (existing behavior)
  - line-level model lists for rendering (new)

### B) Deployment: Copy Full `mainTemplate.json` Deployment Code (Replace Portal Flow)

**New behavior**

- Replace the Region deployment action (Portal-based "一键部署") with "Copy Deployment Code".
- The copied content MUST be the full ARM template JSON derived from `mainTemplate.json`:
  - set `parameters.resourceName.defaultValue`
  - set `parameters.location.defaultValue`
  - set `variables.modelDeployments` from the region's selected deployment rows

**Compatibility**

- This change intentionally replaces the existing Portal-based flow.

## Files Affected (Expected)

### Line-preserving grouping

- `src/utils/common.ts` (extend master directory parser to preserve lines)
- `src/components/AzureModelsDashboard.tsx` (derive and pass line-level groups)
- `src/components/Dashboard/MasterModelDirectory.tsx` (render grouped list by line)
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` (render group rows by line)
- `src/components/Dashboard/Summary/GlobalSummary.tsx` (reflect grouping/lines)
- `src/i18n/locales/zh.json`, `src/i18n/locales/en.json` (labels for group/line UI if needed)

### Deployment code export

- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` (replace Portal deploy with copy deployment code)
- `mainTemplate.json` (template source; treated as read-only input)
- `src/utils/armTemplate.ts` (add helper to build from `mainTemplate.json`)
- `src/i18n/locales/zh.json`, `src/i18n/locales/en.json` (new labels/toasts)

## Implementation Plan

1. **Parser: add a line-preserving representation**
   - Parse groups by blank lines.
   - For each group, split into non-empty lines.
   - Tokenize within each line using commas/spaces/tabs (excluding newline).
   - De-duplicate globally by first appearance (retain existing semantics).

2. **Update Region picker rendering**
   - Replace the current per-group flat chip rendering with per-line rows.
   - Keep existing "select group" behavior (select all models in the group).

3. **Update Global summary**
   - Render by group.
   - Recommended: inside each group, show the same line layout; copy action preserves group ordering.

4. **Replace Region deploy action with template copy**
   - In RegionCard's deployment section, replace the Portal-based action with one-click copy.
   - Generate output by loading `mainTemplate.json` and filling region-specific values.
   - Validate required inputs (per-region resourceName/location, per-model version/capacity).

5. **Tests**
   - Unit tests for line-preserving directory parsing.
   - Unit tests for deployment code builder (stable output for a known input).

6. **Validation**
   - Run `npm run test`, `npm run lint`, `npm run build`.

## Confirmed Decisions

- Deployment code uses `mainTemplate.json` as the base template.
- This replaces the existing Portal-based "一键部署" action.
