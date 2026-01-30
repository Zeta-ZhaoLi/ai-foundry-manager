# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)

> A standalone, browser-based visual management tool for Azure OpenAI model configurations, organized by account and region.

**Azure AI Foundry Manager** is a pure frontend application for managing Azure OpenAI deployments across multiple accounts and regions. All data is stored locally in your browser—no backend required, no data leaves your machine.

---

## ✨ Features

### 🏢 Account Management

- **Account ID System**: Automatic prefix assignment (A-series for premium accounts, B-series for standard)
- **Drag & Drop Reordering**: Easily reorganize accounts and regions
- **Tier Classification**: Categorize accounts as Premium or Standard
- **Quota Tracking**: Visual progress bars for quota usage monitoring
- **Cost Calculation**: Track purchase amount, used amount, cost per dollar, and actual cost
- **Flexible Controls**: Enable/disable accounts and regions, include/exclude from statistics

### 🌍 Region Configuration

- **Multi-Region Support**: Configure multiple Azure regions per account
- **Dual Endpoint Management**: OpenAI and Anthropic endpoints with automatic sync
- **Secure Storage**: Encrypted API key storage
- **Regional Control**: Enable/disable individual regions with drag-and-drop reordering

### 🖥️ Server Management

- **Dual Platform Support**: Windows and Linux server credentials
- **Numeric Server IDs**: Standardized 3-digit IDs (001, 002, etc.) with increment/decrement controls
- **Visual Badges**: Color-coded server badges (Windows: blue, Linux: green)
- **Secure Credentials**: Encrypted password and SSH key storage

### 🤖 Model Management

- **Master Model Directory**: Centralized model catalog with series classification
- **Click-to-Select**: Easy model assignment to accounts and regions
- **Smart Search**: Filter accounts by model name in real-time
- **Statistics & Visualization**: Coverage charts, deployment status, and usage analytics
- **One-Click Copy**: Export model lists with comma formatting for easy integration
- **Category Support**: Organized by Standard, Sora, and Claude series

### 💾 Data & Configuration

- **Local Storage**: All data stored in browser localStorage—fully offline capable
- **Import/Export**: Encrypted JSON configuration backup and restore
- **Version History**: Up to 20 saved configuration versions with manual and automatic save points
- **Privacy Mode**: Hide sensitive information (API keys, endpoints, credentials)

### 🎨 User Interface

- **Multi-language UI**: zh, en, ja, fr, de, es, pt-BR, ko
- **Theme Modes**: Dark, Light, and System theme options
- **Command Palette**: Quick access to all features (Ctrl+K / Cmd+K)
- **Keyboard Shortcuts**: Efficient navigation and actions
- **Responsive Design**: Optimized for desktop and mobile devices
- **Toast Notifications**: Clear feedback for all actions
- **Drag & Drop**: Intuitive reordering throughout the interface

### 📊 Visualizations

- **Dashboard Overview**: Account statistics and model distribution
- **Donut Charts**: Model deployment status and coverage distribution
- **Bar Charts**: Account model distribution analysis
- **Coverage Visualization**: Regional and model coverage metrics
- **Statistics Tables**: Sortable, filterable model and account data with virtual scrolling

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Opens at http://localhost:5173 (or next available port)
```

The development server includes hot module replacement for instant updates during development.

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

Build output is generated in the `dist/` directory, ready for deployment to any static hosting service.

---

## 📖 Usage Guide

### Initial Setup

1. **Add Your First Account**
   - Click "新增账号" (Add Account) button
   - Configure account name, tier (Premium/Standard), and quota
   - Optionally add purchase amount and cost tracking

2. **Configure Regions**
   - Add regions using the "新增区域" (Add Region) button
   - Set region name (e.g., eastus, westeurope)
   - Configure OpenAI and/or Anthropic endpoints
   - Add API keys (automatically encrypted)

3. **Assign Models**
   - Use the **Global Model Directory** at the top to define all available models
   - Click model names in each region to toggle selection
   - Use "Select All" or "Select Category" for bulk operations
   - Search models using the "模型搜索" (Model Search) field

4. **Server Credentials** (Optional)
   - Expand "服务器登录信息" (Server Login Information)
   - Add Windows and/or Linux server credentials
   - Assign numeric server IDs for easy identification

### Privacy Mode

Enable privacy mode to hide sensitive information when sharing your screen:

- API keys displayed as "\*\*\*"
- Endpoints hidden
- Server credentials masked
- Account IDs partially obscured

### Configuration Management

**Export Configuration:**

```
Click "导出配置" (Export Config) → Save encrypted JSON file
```

**Import Configuration:**

```
Click "导入配置" (Import Config) → Select JSON file
```

**Configuration History:**

```
Click "配置历史" (Config History) → View/restore previous versions
```

### Keyboard Shortcuts

| Shortcut       | Action                       |
| -------------- | ---------------------------- |
| `Ctrl/Cmd + K` | Open command palette         |
| `Ctrl/Cmd + E` | Export configuration         |
| `Ctrl/Cmd + D` | Toggle theme                 |
| `Ctrl/Cmd + H` | Toggle privacy mode          |
| `?`            | Show keyboard shortcuts help |
| `Esc`          | Close dialogs                |

---

## 🛠️ Tech Stack

### Core Technologies

| Technology       | Version | Purpose                 |
| ---------------- | ------- | ----------------------- |
| **React**        | 18.3    | UI framework            |
| **TypeScript**   | 5.6     | Type-safe development   |
| **Vite**         | 5.4     | Build tool & dev server |
| **Tailwind CSS** | 3.4     | Utility-first styling   |

### Key Libraries

- **@dnd-kit** (6.3) - Drag and drop functionality
- **i18next** (25.6) + **react-i18next** (16.3) - Internationalization
- **crypto-js** (4.2) - Client-side encryption
- **react-hot-toast** (2.6) - Toast notifications
- **@tanstack/react-virtual** (3.13) - Virtual scrolling for large lists
- **zod** (4.1) - Runtime validation

### Development Tools

- **ESLint** (9.39) - Code linting
- **Prettier** (3.6) - Code formatting
- **Vitest** (4.0) - Unit testing
- **@testing-library/react** (16.3) - Component testing

---

## 📂 Project Structure

```
ai-foundry-manager/
├── src/
│   ├── api/                    # API client utilities
│   ├── components/
│   │   ├── Dashboard/          # Main dashboard components
│   │   │   ├── AccountConfiguration/  # Account & region management
│   │   │   ├── Charts/               # Visualization components
│   │   │   ├── CoverageCharts/       # Coverage analytics
│   │   │   └── Summary/              # Summary views
│   │   └── ui/                 # Reusable UI components
│   ├── contexts/               # React contexts (Theme, etc.)
│   ├── hooks/                  # Custom React hooks
│   │   ├── useLocalAzureAccounts.ts  # Main data management
│   │   ├── useCopyToClipboard.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── i18n/                   # Translations (zh/en)
│   │   └── locales/
│   │       ├── zh.json
│   │       └── en.json
│   ├── types/                  # TypeScript definitions
│   ├── utils/                  # Utility functions
│   │   ├── modelSeries.ts      # Model classification
│   │   ├── encryption.ts       # Data encryption
│   │   ├── accountIdGenerator.ts  # ID assignment
│   │   └── common.ts           # Common utilities
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
├── openspec/                   # OpenSpec change management
│   ├── specs/                  # Feature specifications
│   └── changes/                # Change proposals & history
├── public/                     # Static assets
└── dist/                       # Production build output
```

---

## 💾 Data Storage

### Local Storage Architecture

All data is stored in your browser's `localStorage`:

```javascript
// Storage Keys
'ai-foundry-manager:accounts'; // Account configurations
'ai-foundry-manager:master-models'; // Global model directory
'ai-foundry-manager:config-history'; // Configuration versions
```

### Encryption

Sensitive data is encrypted using **AES encryption** (crypto-js) before storage:

- ✅ API keys
- ✅ Server passwords
- ✅ SSH private keys
- ✅ Exported configuration files

**Encryption Key:** Generated from browser fingerprint + timestamp (stored in localStorage)

### Privacy Guarantee

- **No Backend**: Purely client-side application
- **No External Calls**: No data sent to external servers
- **Offline Capable**: Works without internet connection
- **Local Only**: Data never leaves your browser

---

## 🔒 Privacy & Security

### Data Privacy

- **100% Client-Side**: All processing happens in your browser
- **No Telemetry**: No analytics or tracking
- **No External API Calls**: Except when you explicitly configure endpoints
- **Privacy Mode**: One-click hiding of all sensitive information

### Security Features

- **AES Encryption**: Sensitive credentials encrypted at rest
- **No Plain Text**: API keys and passwords never stored unencrypted
- **Browser Isolation**: Each browser profile has independent data
- **Export Protection**: Configuration exports are encrypted

### Best Practices

1. Enable **Privacy Mode** when sharing your screen
2. Regularly **export configurations** as encrypted backups
3. Use **strong passwords** for server credentials
4. Clear browser data if sharing a device
5. Keep the browser updated for security patches

---

## 🔧 Development

### Available Commands

```bash
# Development
npm run dev          # Start dev server with HMR

# Building
npm run build        # Production build
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier

# Testing
npm test             # Run tests in watch mode
npm test:ui          # Run tests with UI
```

### Development Workflow

This project uses **OpenSpec** for structured change management:

1. **Propose Changes**: Create proposals in `openspec/changes/`
2. **Write Specs**: Define requirements with scenarios
3. **Implement**: Follow the approved specification
4. **Validate**: Ensure specs are met
5. **Archive**: Move completed changes to archive

See `openspec/AGENTS.md` for detailed conventions.

### Code Style

- **Component Naming**: PascalCase (e.g., `AccountCard.tsx`)
- **Utility Naming**: camelCase (e.g., `parseModels.ts`)
- **Export Style**: Named exports preferred
- **Comments**: Chinese comments in source code
- **TypeScript**: Strict mode enabled

---

## 🤝 Contributing

Contributions are welcome! This project follows the OpenSpec workflow for managing changes.

### Process

1. **Check Issues**: Look for existing issues or create a new one
2. **Create Proposal**: Use `openspec:proposal` to create a structured proposal
3. **Discussion**: Discuss the approach in the issue
4. **Implementation**: Follow the approved OpenSpec proposal
5. **Testing**: Ensure all tests pass and features work as specified
6. **Pull Request**: Submit PR referencing the proposal and issue

### Guidelines

- Follow the existing code style (enforced by ESLint + Prettier)
- Add tests for new features
- Update documentation when adding features
- Keep commits atomic and well-described
- Ensure OpenSpec specs are validated before submitting

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

**MIT License Summary:**

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

---

## 👤 Author

**赵利利 (ZetaTechs)**

- GitHub: [@Zeta-ZhaoLi](https://github.com/Zeta-ZhaoLi)
- Email: Available in package.json

---

## 🔗 Links

- **Repository**: [github.com/Zeta-ZhaoLi/ai-foundry-manager](https://github.com/Zeta-ZhaoLi/ai-foundry-manager)
- **Issues**: [github.com/Zeta-ZhaoLi/ai-foundry-manager/issues](https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues)
- **Changelog**: See `openspec/changes/archive/` for detailed change history

---

## 🙏 Acknowledgments

- **React Team** - For the amazing UI framework
- **Vite Team** - For the lightning-fast build tool
- **Tailwind CSS** - For the utility-first CSS framework
- **Open Source Community** - For the incredible libraries that make this possible

---

**Built with ❤️ by ZetaTechs**
