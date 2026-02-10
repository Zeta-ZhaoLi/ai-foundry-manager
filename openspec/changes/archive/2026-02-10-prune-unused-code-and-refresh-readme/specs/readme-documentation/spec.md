# readme-documentation Specification

## MODIFIED Requirements

### Requirement: Comprehensive Feature Documentation

The README SHALL document major currently available features and SHALL avoid describing removed or non-shipped features as active capabilities.

#### Scenario: README reflects current feature set only

**Given** the current implementation after cleanup

**When** a user reads the Features and Usage sections

**Then** documented features MUST match behaviors available in the app

**And** removed/deprecated capabilities MUST NOT be presented as active functionality

---

### Requirement: Professional Formatting

The README SHALL remain well-structured, readable, and organized for quick onboarding, without rigid line-count constraints.

#### Scenario: README uses practical structure for scanning

**Given** a user opens `README.md`

**When** they scan sections for setup and capabilities

**Then** the README MUST include clear headings for overview, features, setup, and development

**And** command examples MUST be copy-pasteable code blocks with language hints

**And** documentation quality MUST be evaluated by clarity/accuracy rather than fixed total line count

## ADDED Requirements

### Requirement: Optional/Internal Capability Labeling

When the repository contains technical modules not surfaced as primary UI features, the README MUST label them clearly as optional/internal to avoid user confusion.

#### Scenario: Optional integrations are explicitly labeled

**Given** a capability exists in code but is not part of the primary UI workflow

**When** README references that capability

**Then** the README MUST mark it as optional/internal

**And** MUST NOT imply it is required for core usage

---

### Requirement: Localized README Synchronization

All localized README variants MUST stay aligned with canonical README section structure and current feature claims.

#### Scenario: Canonical README update propagates to localized variants

**Given** `README.md` is reorganized and refreshed for current implementation

**When** documentation updates are finalized

**Then** `README.zh-CN.md`, `README.ja.md`, `README.fr.md`, `README.de.md`, `README.es.md`, `README.pt-BR.md`, and `README.ko.md` MUST be updated to match section hierarchy and core capability statements

**And** each localized README MUST retain a language index block linking to all README variants
