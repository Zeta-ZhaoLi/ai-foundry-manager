# master-model-directory-copy-actions Specification

## Purpose
TBD - created by archiving change 2026-01-30-remove-global-summary-and-expand-master-directory-copy. Update Purpose after archive.
## Requirements
### Requirement: Remove Bottom Global Summary Panel

The dashboard MUST NOT render a bottom "Global Model Summary" panel.

#### Scenario: No global summary section

**Given** the user opens the main dashboard

**When** the page is rendered

**Then** the UI MUST NOT display a section titled "Global Model Summary" / "全局模型汇总"

---

### Requirement: Copy Directory List (All)

The Global Model Directory panel MUST provide an action to copy the full directory list.

The copied text MUST include all parsed models and MUST include commas.

#### Scenario: Copy all parsed models

**Given** the Global Model Directory contains a non-empty list of models

**When** the user triggers "Copy Directory List (All)"

**Then** the clipboard MUST contain every parsed model from the directory

**And** each model entry MUST include a trailing comma

---

### Requirement: Copy Directory List (Deployed)

The Global Model Directory panel MUST provide an action to copy the deployed model list.

"Deployed" MUST be defined as the union of selected models across enabled accounts and enabled regions.

#### Scenario: Copy deployed models

**Given** there are enabled accounts and enabled regions with selected models

**When** the user triggers "Copy Directory List (Deployed)"

**Then** the clipboard MUST contain the union of those selected models

---

### Requirement: Copy Group (All)

Each directory group MUST provide an action to copy all models in that group.

#### Scenario: Copy group all

**Given** a directory group contains models

**When** the user triggers "Copy This Group (All)"

**Then** the clipboard MUST contain all parsed models from that group

---

### Requirement: Copy Group (Deployed)

Each directory group MUST provide an action to copy deployed models within that group.

#### Scenario: Copy group deployed

**Given** a directory group contains models

**And** some of those models are deployed in enabled accounts/regions

**When** the user triggers "Copy This Group (Deployed)"

**Then** the clipboard MUST contain only the deployed models that belong to that group

