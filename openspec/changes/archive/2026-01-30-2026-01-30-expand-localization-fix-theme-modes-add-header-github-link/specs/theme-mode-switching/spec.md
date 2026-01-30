# Theme Mode Switching

## ADDED Requirements

### Requirement: Light Theme Is Visually Light

When the theme preference is set to `light`, the UI MUST render with a light background and dark text.

#### Scenario: Light theme renders light palette

**Given** the user sets theme preference to `light`

**When** the application renders

**Then** the root element MUST NOT have class `dark`

**And** the primary page background MUST be a light color

**And** primary text MUST be a dark color

---

### Requirement: System Theme Tracks OS Preference

When the theme preference is set to `system`, the UI MUST resolve to the current OS `prefers-color-scheme` and update when the OS preference changes.

#### Scenario: System theme follows OS preference

**Given** the user sets theme preference to `system`

**When** the OS preference is light

**Then** the application MUST render the light palette

#### Scenario: System theme updates live

**Given** the user sets theme preference to `system`

**When** the OS `prefers-color-scheme` changes

**Then** the application MUST update the resolved theme without a page reload
