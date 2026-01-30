# master-model-directory-model-item-interactions

## ADDED Requirements

### Requirement: Heatmap Color Reflects Deployed Region Count

In the Global Model Directory parsed list, each model item MUST apply a heatmap-style color treatment based on the model's deployed region count.

"Deployed region count" MUST use the same definition as `master-model-directory-model-deployment-count` (enabled accounts + enabled regions where the model is selected).

The heatmap mapping MUST be deterministic and MUST be monotonic: if `countA > countB`, the resulting heat bucket for A MUST NOT be cooler than B.

#### Scenario: Higher counts map to hotter buckets

**Given** a directory where `maxCount` across models is `8`

**And** model `m0` has `count=0`

**And** model `m1` has `count=2`

**And** model `m2` has `count=4`

**And** model `m3` has `count=6`

**And** model `m4` has `count=8`

**When** the Global Model Directory parsed list is rendered

**Then** the heatmap bucket applied to `m0` MUST be the coolest bucket

**And** the bucket applied to `m4` MUST be the hottest bucket

**And** buckets for `m1..m3` MUST be non-decreasing with their counts

---

### Requirement: Heatmap Is Color-Only

Applying the heatmap MUST NOT change the model item layout/shape.

#### Scenario: Pill layout is preserved

**Given** the Global Model Directory parsed list is rendered

**When** the heatmap styling is applied

**Then** the model items MUST preserve their existing pill layout and badge placement

**And** only color styling (background/border/text colors) MAY differ by deployed region count

---

### Requirement: Click Model Item Copies Model ID

In the Global Model Directory parsed list, clicking a model item MUST copy the model ID string to the clipboard.

The copied text MUST be exactly the model ID (no trailing comma).

#### Scenario: Click copies model ID

**Given** the parsed list contains model `gpt-4o`

**When** the user clicks the `gpt-4o` model item

**Then** the clipboard MUST contain `gpt-4o`
