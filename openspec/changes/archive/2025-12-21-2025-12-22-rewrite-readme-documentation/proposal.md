# Rewrite README Documentation

## Why

The current README.md is outdated and doesn't accurately reflect the project's current state:

1. **Incorrect project description**: The README describes this as a tool for "new-api integration" that calls external APIs, but the project has evolved into a **standalone localStorage-based** configuration manager with no new-api dependency
2. **Missing key features**: No documentation of major features like:
   - Account ID system (A-series premium, B-series standard)
   - Server credentials management (Windows/Linux servers with badges)
   - Model search with account filtering
   - Privacy mode
   - Configuration history and version management
   - Drag-and-drop reordering
   - Bilingual support (Chinese/English)
   - Dark/Light/System theme
3. **Outdated architecture**: The README references `useAzureChannels.ts` and new-api integration, but the actual implementation uses `useLocalAzureAccounts.ts` with localStorage persistence
4. **No screenshots or visual examples**: Users can't see what the tool looks like
5. **Missing deployment/usage instructions**: No clear guidance on how to actually use the tool

## What Changes

### Complete README Rewrite

Replace the existing README.md with comprehensive documentation that includes:

#### 1. Project Header
- Clear project title and tagline
- Badges (license, version, build status if applicable)
- Brief one-sentence description
- Screenshot/demo GIF of the interface

#### 2. Overview Section
- What the project is: **Standalone Azure AI Foundry configuration manager**
- What it does: Visual management of Azure OpenAI model configurations by account and region
- Key value proposition: Browser-based, no backend required, all data in localStorage
- Target users: Azure OpenAI administrators managing multiple accounts/regions

#### 3. Features Section
Comprehensive list of all implemented features:

**Account Management**
- Account ID system with automatic prefix assignment (A-series for premium, B-series for standard)
- Drag-and-drop reordering
- Account tier classification (Premium/Standard)
- Quota tracking with visual progress bars
- Cost calculation (purchase amount, used amount, actual cost per dollar)
- Enable/disable accounts and regions
- Include/exclude from statistics

**Region Configuration**
- Multiple regions per account
- OpenAI and Anthropic endpoint configuration with auto-sync
- API key storage (encrypted)
- Drag-and-drop region reordering
- Enable/disable individual regions

**Server Management**
- Windows and Linux server credentials
- Numeric server IDs (001, 002, etc.) with increment/decrement controls
- Server badges with platform-specific colors (Windows blue, Linux green)
- Password and SSH key storage (encrypted)

**Model Management**
- Master model directory
- Click-to-select model assignment
- Model search with account filtering
- Model statistics and coverage visualization
- Copy model lists with comma formatting
- Model category classification (Standard, Sora, Claude series)

**Data & Configuration**
- All data stored in browser localStorage
- Configuration import/export (encrypted JSON)
- Configuration history with version management (up to 20 versions)
- Manual and automatic save points
- Privacy mode to hide sensitive information

**User Interface**
- Bilingual support (Chinese/English)
- Dark/Light/System theme modes
- Command palette (Ctrl+K / Cmd+K)
- Keyboard shortcuts
- Responsive design for mobile and desktop
- Toast notifications
- Drag-and-drop interfaces

**Visualizations**
- Account overview dashboard
- Model deployment status charts (donut charts)
- Coverage distribution visualization
- Account model distribution bar charts
- Region coverage charts
- Model statistics table with filtering

#### 4. Tech Stack Section
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS
- Key libraries: @dnd-kit, i18next, react-hot-toast, crypto-js, @tanstack/react-virtual
- localStorage for data persistence
- Client-side encryption for sensitive data

#### 5. Getting Started
```bash
# Prerequisites
Node.js 18+ and npm

# Installation
git clone <repository-url>
cd ai-foundry-manager
npm install

# Development
npm run dev
# Opens at http://localhost:5173 (or next available port)

# Build for production
npm run build

# Preview production build
npm run preview
```

#### 6. Usage Guide
- Initial setup: Add your first account
- Configure regions and models
- Use the master model directory
- Enable privacy mode when sharing screen
- Export configurations for backup
- Keyboard shortcuts reference

#### 7. Project Structure
Brief overview of the src/ directory structure:
- `components/` - React components organized by feature
- `hooks/` - Custom React hooks for state management
- `utils/` - Utility functions
- `i18n/` - Internationalization files
- `types/` - TypeScript type definitions

#### 8. Data Storage
- Explain that all data is stored in browser localStorage
- Sensitive data (API keys, passwords, SSH keys) is encrypted using crypto-js
- Configuration can be exported as encrypted JSON
- No data leaves the browser (fully client-side)

#### 9. Privacy & Security
- Privacy mode for hiding sensitive information
- Client-side encryption for credentials
- No external API calls (fully offline-capable)
- Data never leaves your browser

#### 10. Development
```bash
npm run lint          # Lint code
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code with Prettier
npm test              # Run tests
npm test:ui           # Run tests with UI
```

#### 11. Contributing
- OpenSpec-based development workflow
- How to propose changes
- Code style guidelines

#### 12. License
MIT License

#### 13. Author & Credits
- Author: 赵利利 (ZetaTechs)
- Repository link
- Issue tracker

## Files Affected

### README.md
- **Complete rewrite** from current 40 lines to comprehensive ~300-400 line documentation
- Add sections: Features, Tech Stack, Getting Started, Usage, Data Storage, Privacy, Development
- Add visual elements (badges, screenshots if available)
- Update all outdated information about new-api integration

## Implementation Plan

### Phase 1: Content Planning
1. Audit current features by reviewing all specs
2. Take screenshots of key UI sections
3. Document all keyboard shortcuts
4. List all configuration options

### Phase 2: Write Core Sections
1. Write project overview and value proposition
2. Document comprehensive feature list
3. Create getting started guide
4. Write usage instructions

### Phase 3: Technical Documentation
1. Document tech stack with versions
2. Explain project structure
3. Document data storage and encryption
4. Write development guidelines

### Phase 4: Polish & Visual Elements
1. Add badges (MIT license, etc.)
2. Add screenshots or create demo GIF
3. Format code blocks
4. Add table of contents
5. Proofread both English and Chinese sections

### Phase 5: Validation
1. Verify all npm commands work
2. Test all documentation links
3. Ensure accuracy of technical details
4. Review for completeness

## Risks/Considerations

### Content Accuracy
- **Risk**: Documentation may become outdated as features evolve
- **Mitigation**: Follow OpenSpec workflow to update README when capabilities change

### Language
- **Risk**: Should README be in English, Chinese, or bilingual?
- **Decision needed**: Clarify preferred language for README
- **Recommendation**: English primary with Chinese summary, since package.json and code have English keywords

### Screenshots
- **Risk**: Screenshots become outdated quickly
- **Mitigation**: Keep screenshots minimal, focus on high-level UI overview only
- **Alternative**: Consider animated GIF showing key workflow

### Length
- **Risk**: Very comprehensive README may be overwhelming
- **Mitigation**: Use collapsible sections if hosted on GitHub, clear table of contents

## Success Criteria

1. ✅ README accurately describes current project architecture (localStorage-based, no new-api)
2. ✅ All major features documented with clear descriptions
3. ✅ Getting started guide works for new users
4. ✅ Tech stack section lists all key dependencies
5. ✅ Data storage and encryption clearly explained
6. ✅ Development commands documented and verified
7. ✅ No references to outdated new-api integration
8. ✅ Professional formatting with proper sections
9. ✅ Includes license, author, and repository information
10. ✅ README is 300-400 lines (comprehensive but not overwhelming)

## Questions for User

Before proceeding with implementation:

1. **Language preference**: Should the README be in English, Chinese, or bilingual?
2. **Screenshots**: Do you have screenshots of the UI, or should we create them?
3. **Demo GIF**: Would you like an animated GIF showing key workflows?
4. **Badge preferences**: Which badges should we include (license, version, build status, etc.)?
5. **Repository URL**: What is the actual GitHub repository URL to link to?
