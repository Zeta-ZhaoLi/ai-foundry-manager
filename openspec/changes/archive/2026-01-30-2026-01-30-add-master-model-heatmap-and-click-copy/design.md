# Design Notes

## Data Source: Deployed Region Count

Use `deployedRegionCounts[m]` already passed into `MasterModelDirectory`.

Per existing spec `master-model-directory-model-deployment-count`, the count is defined as the number of enabled regions under enabled accounts where the model is selected.

## Heatmap: "Color-Only" Constraint

The model item currently uses:

- a pill element (`px-2 py-0.5 rounded-full text-xs ...`)
- a fixed border/background gradient
- a badge with absolute positioning

Implementation must keep all non-color classes identical and only change:

- `bg-*` / `from-*` / `to-*`
- `text-*`
- `border-*`

## Heatmap Mapping Strategy

We will implement a deterministic bucket mapping from `(count, maxCount)`.

Recommended: relative buckets by ratio, producing 5 discrete buckets to keep UI consistent and avoid imperceptible gradients.

Palette direction:

- 0 regions: muted (cool)
- more regions: progressively warmer/more saturated

We will ensure adequate contrast in both themes using `dark:` variants.

## Click-to-Copy

Convert the model pill from a plain `<span>` to a clickable element (prefer `button type="button"`) while preserving the existing classes that define layout/shape.

When clicked:

- call the existing `onCopy(m, m)` handler with `m` (no comma)
- keep other copy actions unchanged
