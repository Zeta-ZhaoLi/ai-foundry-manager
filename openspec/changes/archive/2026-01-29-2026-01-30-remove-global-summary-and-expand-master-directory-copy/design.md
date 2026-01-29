# Design

## Data Sources

- **All models**: derived from parsing the Global Model Directory.
- **Deployed models**: derived from enabled accounts/regions model selections.

Existing behavior already computes a union list of selected models across enabled accounts/regions for statistics. This change reuses that definition to power copy actions.

## Copy Semantics

### Directory List (All)

- Source: parsed master directory flattened list (`masterModels`).
- Order: directory order.
- Format: comma-suffixed tokens (same as existing copy output).

### Directory List (Deployed)

- Source: union of models deployed in enabled accounts/regions.
- Order: directory order first; then models not present in the directory appended after.

### Group Copy (All)

- Source: group models.
- Recommended formatting: keep the authored line layout (line-preserving), with commas.

### Group Copy (Deployed)

- Source: intersection of group models and deployed model set.
- Recommended formatting: preserve line layout and drop empty lines.

## UI Layout

To avoid an overloaded single button, implement the 4 requested copy variants as:

- Directory header:
  - Copy Directory List (All)
  - Copy Directory List (Deployed)
- Each group header:
  - Copy This Group (All)
  - Copy This Group (Deployed)

This provides exactly the four copy types with clear context.

## Model Deployment Count Badges

### Definition

For each model in the parsed master directory list, compute:

- `deployedRegionCount[model] = number of enabled regions (across enabled accounts) whose modelsText includes model`

This matches the same enabled-only definition used elsewhere.

### Rendering

- Each model chip in the master directory list shows a small circular badge at top-right.
- Badge text is the count (including 0).

## Account ID Display

### Model overview/statistics "deployed accounts"

Replace numeric indices with `account.accountId` values (e.g. A017/B030).

- Only enabled accounts should contribute.
- For any account missing `accountId` (legacy), fall back to the existing numeric index.

### Account overview table

Add a dedicated "Account ID" column.
