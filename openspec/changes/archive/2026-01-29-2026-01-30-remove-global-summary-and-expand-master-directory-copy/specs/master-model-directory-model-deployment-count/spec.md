# Master Model Directory Model Deployment Counts

## ADDED Requirements

### Requirement: Per-Model Region Deployment Count Badge

In the Global Model Directory list, each model item MUST display a small circular count badge indicating how many enabled regions have deployed/selected the model.

"Enabled regions" MUST be defined as regions under accounts where `account.enabled !== false` and regions where `region.enabled !== false`.

#### Scenario: Badge shows number of regions

**Given** model `m1` is selected in 3 enabled regions

**And** model `m2` is selected in 0 enabled regions

**When** the Global Model Directory list is rendered

**Then** the badge for `m1` MUST show `3`

**And** the badge for `m2` MUST show `0`
