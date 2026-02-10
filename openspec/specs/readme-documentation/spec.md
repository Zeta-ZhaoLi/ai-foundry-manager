# readme-documentation Specification

## Purpose
TBD - created by archiving change 2025-12-22-rewrite-readme-documentation. Update Purpose after archive.
## Requirements
### Requirement: Project Description Accuracy

The README SHALL accurately describe the project as a standalone localStorage-based configuration manager, not a new-api integration tool.

**Files:**
- `README.md`

#### Scenario: README describes localStorage architecture

**Given** a user reads the README
**When** they reach the project description
**Then** the README SHALL describe the tool as "standalone Azure AI Foundry configuration manager"
**And** the README SHALL explain data is stored in browser localStorage
**And** the README SHALL NOT reference new-api API calls
**And** the README SHALL NOT mention `/api/channel` endpoints

#### Scenario: README clarifies no backend requirement

**Given** a user evaluates project dependencies
**When** they read the architecture section
**Then** the README SHALL explicitly state "no backend required"
**And** the README SHALL explain "fully client-side"
**And** the README SHALL clarify "all data stored in browser"

### Requirement: Comprehensive Feature Documentation

The README SHALL document major currently available features and SHALL avoid describing removed or non-shipped features as active capabilities.

#### Scenario: README reflects current feature set only

**Given** the current implementation after cleanup

**When** a user reads the Features and Usage sections

**Then** documented features MUST match behaviors available in the app

**And** removed/deprecated capabilities MUST NOT be presented as active functionality

---

### Requirement: Getting Started Guide

The README SHALL provide clear installation and setup instructions for new users.

**Files:**
- `README.md`

#### Scenario: Prerequisites clearly stated

**Given** a new user wants to run the project
**When** they read the Getting Started section
**Then** the README SHALL list Node.js 18+ as prerequisite
**And** the README SHALL list npm as prerequisite

#### Scenario: Installation steps provided

**Given** a new user wants to install the project
**When** they follow the installation instructions
**Then** the README SHALL provide git clone command
**And** the README SHALL provide npm install command
**And** the README SHALL specify the correct repository URL

#### Scenario: Development commands documented

**Given** a developer wants to run the project
**When** they read the development section
**Then** the README SHALL provide npm run dev command
**And** the README SHALL specify the default dev server URL
**And** the README SHALL provide npm run build command
**And** the README SHALL provide npm run preview command

### Requirement: Technical Stack Documentation

The README SHALL accurately document all key technologies and dependencies.

**Files:**
- `README.md`

#### Scenario: Core technologies listed

**Given** a user evaluates the tech stack
**When** they read the Tech Stack section
**Then** the README SHALL list React 18
**And** the README SHALL list TypeScript
**And** the README SHALL list Vite 5
**And** the README SHALL list Tailwind CSS 3

#### Scenario: Key libraries documented

**Given** a user wants to understand dependencies
**When** they read the Tech Stack section
**Then** the README SHALL list @dnd-kit for drag-and-drop
**And** the README SHALL list i18next for internationalization
**And** the README SHALL list crypto-js for encryption
**And** the README SHALL list react-hot-toast for notifications
**And** the README SHALL list @tanstack/react-virtual for virtualization

### Requirement: Data Storage Explanation

The README SHALL clearly explain how and where data is stored.

**Files:**
- `README.md`

#### Scenario: Storage mechanism documented

**Given** a user wants to understand data persistence
**When** they read the Data Storage section
**Then** the README SHALL explain data is stored in localStorage
**And** the README SHALL explain data never leaves the browser
**And** the README SHALL explain sensitive data is encrypted
**And** the README SHALL explain encryption uses crypto-js

#### Scenario: Privacy assurance provided

**Given** a user has privacy concerns
**When** they read the Privacy & Security section
**Then** the README SHALL state "fully client-side"
**And** the README SHALL state "no external API calls"
**And** the README SHALL explain encrypted credentials
**And** the README SHALL mention privacy mode feature

### Requirement: Professional Formatting

The README SHALL remain well-structured, readable, and organized for quick onboarding, without rigid line-count constraints.

#### Scenario: README uses practical structure for scanning

**Given** a user opens `README.md`

**When** they scan sections for setup and capabilities

**Then** the README MUST include clear headings for overview, features, setup, and development

**And** command examples MUST be copy-pasteable code blocks with language hints

**And** documentation quality MUST be evaluated by clarity/accuracy rather than fixed total line count

### Requirement: Metadata and Attribution

The README SHALL include proper project metadata, licensing, and attribution.

**Files:**
- `README.md`

#### Scenario: License clearly stated

**Given** a user wants to know usage rights
**When** they read the License section
**Then** the README SHALL state "MIT License"
**And** the README SHALL link to LICENSE file if present

#### Scenario: Author attribution included

**Given** the project has an author
**When** a user reads the credits
**Then** the README SHALL list "赵利利 (ZetaTechs)" as author
**And** the README SHALL provide repository URL
**And** the README SHALL provide issue tracker link

#### Scenario: Repository links functional

**Given** the README contains repository references
**When** a user clicks repository links
**Then** links SHALL point to correct GitHub repository
**And** links SHALL be absolute URLs (https://github.com/...)

### Requirement: Localized README Variants

The repository MUST provide localized README files aligned to the canonical `README.md`.

**Files:**

- `README.md` (canonical)
- `README.zh-CN.md`
- `README.ja.md`
- `README.fr.md`
- `README.de.md`
- `README.es.md`
- `README.pt-BR.md`
- `README.ko.md`

#### Scenario: Localized READMEs exist

**Given** a user visits the repository

**When** they look for documentation in a common language

**Then** the repository MUST provide localized README files for Chinese, Japanese, French, and German

---

### Requirement: README Language Index

Each README file MUST include a language index block at the top linking to the other README language variants.

#### Scenario: README provides language links

**Given** a user opens any README variant

**When** they view the first section of the README

**Then** the README MUST include links to the other language versions

---

### Requirement: README Documents Supported UI Languages

The canonical `README.md` MUST list the supported UI languages.

#### Scenario: README lists supported languages

**Given** a user reads the Features section

**When** they reach the internationalization/language feature bullets

**Then** the README MUST list `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, and `ko` as supported UI languages

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

