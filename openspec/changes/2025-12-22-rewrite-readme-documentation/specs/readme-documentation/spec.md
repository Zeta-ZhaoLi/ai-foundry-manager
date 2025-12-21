# README Documentation

## MODIFIED Requirements

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

The README SHALL document all major features implemented in the project, organized by category.

**Files:**
- `README.md`

#### Scenario: Account management features documented

**Given** the project has account management capabilities
**When** a user reads the Features section
**Then** the README SHALL list account ID system (A-series premium, B-series standard)
**And** the README SHALL list drag-and-drop reordering
**And** the README SHALL list account tier classification
**And** the README SHALL list quota tracking with progress bars
**And** the README SHALL list cost calculation features

#### Scenario: Server management features documented

**Given** the project has server credentials management
**When** a user reads the Features section
**Then** the README SHALL list Windows and Linux server support
**And** the README SHALL list numeric server IDs with spinners
**And** the README SHALL list server badges with platform colors
**And** the README SHALL list encrypted credential storage

#### Scenario: Model management features documented

**Given** the project has model configuration capabilities
**When** a user reads the Features section
**Then** the README SHALL list master model directory
**And** the README SHALL list click-to-select model assignment
**And** the README SHALL list model search with account filtering
**And** the README SHALL list model coverage visualization
**And** the README SHALL list copy-to-clipboard functionality

#### Scenario: Configuration features documented

**Given** the project has configuration management
**When** a user reads the Features section
**Then** the README SHALL list import/export functionality
**And** the README SHALL list configuration history (20 versions)
**And** the README SHALL list privacy mode
**And** the README SHALL list encrypted data storage

#### Scenario: UI features documented

**Given** the project has comprehensive UI features
**When** a user reads the Features section
**Then** the README SHALL list bilingual support (Chinese/English)
**And** the README SHALL list theme modes (Dark/Light/System)
**And** the README SHALL list command palette
**And** the README SHALL list keyboard shortcuts
**And** the README SHALL list responsive design

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

The README SHALL follow professional documentation standards with proper structure and formatting.

**Files:**
- `README.md`

#### Scenario: Proper sections included

**Given** a user reads the README
**When** they navigate through sections
**Then** the README SHALL include Overview section
**And** the README SHALL include Features section
**And** the README SHALL include Getting Started section
**And** the README SHALL include Tech Stack section
**And** the README SHALL include Data Storage section
**And** the README SHALL include Development section
**And** the README SHALL include License section
**And** the README SHALL include Author section

#### Scenario: Code blocks properly formatted

**Given** the README contains code examples
**When** a user views installation commands
**Then** code blocks SHALL use proper markdown syntax (```bash)
**And** code blocks SHALL include syntax highlighting hints
**And** commands SHALL be copy-pasteable

#### Scenario: Length appropriate for comprehensiveness

**Given** the README aims to be comprehensive
**When** measuring the documentation
**Then** the README SHALL be 300-400 lines
**And** content SHALL be organized with clear headings
**And** sections SHALL use proper heading hierarchy

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
