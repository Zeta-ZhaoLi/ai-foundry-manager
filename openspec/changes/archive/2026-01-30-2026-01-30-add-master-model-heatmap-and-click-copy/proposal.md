# Add Master Model Heatmap Colors and Click-to-Copy

## Why

- The Global Model Directory already shows a per-model deployed-region count badge, but all model items share the same color, so the relative "hotness" is not obvious at a glance.
- Copying a single model ID currently requires manual selection; adding click-to-copy on each model item improves speed and reduces mistakes.

## What Changes

### 1) Heatmap Coloring for Model Items (Color-Only)

In the parsed Global Model Directory list (the pill items rendered from `masterGroupLines`), apply a heatmap-style color treatment based on the model's deployed region count.

Constraints (explicitly required):

- Only modify colors (`background`, `border`, `text`, badge colors).
- Do not change layout/shape (padding, border radius, badge position/size, gaps, grouping, etc.).

### 2) Click Model Name to Copy Model ID

In the parsed Global Model Directory list, clicking a model item copies the model ID string to the clipboard.

- Copy text: the exact model ID (no trailing comma).
- Reuse the existing copy/toast path used by other copy actions.

## Current State (Observed)

- `src/components/Dashboard/MasterModelDirectory.tsx` renders each model as a pill with fixed gradient colors, plus a count badge showing `deployedRegionCounts[m] || 0`.
- Copy actions exist for directory/group (all/deployed), but there is no per-model click-to-copy interaction.

## Proposed Heatmap Mapping

We will use `deployedRegionCounts[m]` (already computed as the number of enabled regions where the model is selected) and compute `maxCount` across `masterModels`.

Confirmed mapping: relative buckets by ratio `count / maxCount`:

- `count === 0`: bucket 0 (coolest / muted)
- `0 < ratio <= 0.25`: bucket 1
- `0.25 < ratio <= 0.5`: bucket 2
- `0.5 < ratio <= 0.75`: bucket 3
- `0.75 < ratio <= 1`: bucket 4 (hottest)

Implementation uses Tailwind classes and `dark:` variants where needed, changing only color-related classes.

## Files Affected (Expected)

- `src/components/Dashboard/MasterModelDirectory.tsx`
  - apply heatmap color classes to each model pill and/or the existing count badge
  - add per-model click handler to copy model ID
- `src/utils/*` (new small helper)
  - compute heatmap bucket/classes from `(count, maxCount)`
- `src/utils/__tests__/*` and/or `src/components/Dashboard/__tests__/*`
  - add tests for heatmap bucketing and click-to-copy behavior
- `src/i18n/locales/*.json` (optional)
  - if we add a tooltip/aria label like "Click to copy", reuse existing keys where possible

## Testing / Validation

- Manual:
  - With multiple regions enabled and models selected, confirm higher counts render with "hotter" colors.
  - Confirm that only color changes (pill layout, spacing, badge placement remain unchanged).
  - Click a model pill: clipboard contains exactly the model ID.

- Automated:
  - Unit test the bucket mapping for a known `(count, maxCount)` set.
  - Component test: clicking a model item calls the copy handler with the correct text.
