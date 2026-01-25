# Project Context

## Overview

**AI Foundry Manager** is a local-first, browser-based dashboard for managing Azure OpenAI accounts/regions, model lists, endpoints, quotas/cost notes, and related operational metadata.

The primary workflow is:

- Maintain a master model directory and per-account/per-region model selections
- Export/copy model lists for configuring downstream systems (e.g. new-api/one-api)

The codebase also contains an (optional / not currently surfaced in the UI) `new-api` admin API client for pulling Azure channel models.

## Tech Stack

| Category               | Technology                                                 |
| ---------------------- | ---------------------------------------------------------- |
| Language               | TypeScript (strict mode)                                   |
| Framework              | React 18                                                   |
| Build Tool             | Vite 5                                                     |
| Styling                | Tailwind CSS 3                                             |
| State Management       | React hooks + localStorage persistence (custom hooks)      |
| HTTP Client            | Custom fetch wrapper (`src/api/newApiClient.ts`)           |
| Internationalization   | i18next + react-i18next                                    |
| Validation             | Zod (light usage; prefer TS + runtime checks where needed) |
| Testing                | Vitest + React Testing Library                             |
| Drag & Drop            | @dnd-kit                                                   |
| Virtualization         | @tanstack/react-virtual                                    |
| Notifications          | react-hot-toast                                            |
| Client-Side Encryption | crypto-js (AES)                                            |
| Linting                | ESLint + Prettier                                          |

## Project Structure

```
src/
├── api/                    # API client for new-api integration
│   └── newApiClient.ts
├── components/
│   ├── AzureModelsDashboard.tsx  # Main single-page dashboard composition
│   ├── Dashboard/          # Main dashboard components
│   │   ├── AccountConfiguration/  # Account & region management
│   │   ├── Charts/               # Visualization (Donut, Bar)
│   │   ├── CoverageCharts/       # Model & region coverage
│   │   └── Summary/              # Account & global summaries
│   ├── CommandPalette.tsx        # Ctrl/Cmd+K command palette
│   ├── KeyboardShortcutsHelp.tsx # Keyboard shortcuts modal
│   ├── ui/                 # Reusable UI components (Button, Card, Dialog, etc.)
│   ├── ConfigImportExport/ # Config import/export functionality
│   ├── ErrorBoundary/      # Error handling
│   └── Toast/              # Toast notifications
├── contexts/               # React contexts (ThemeContext)
├── hooks/                  # Custom hooks
│   ├── useAzureChannels.ts # Channel data fetching & aggregation
│   ├── useLocalAzureAccounts.ts
│   ├── useConfigHistory.ts  # Local config versioning (max 20)
│   ├── useAuditLog.ts       # Local audit log + undo/redo stacks
│   ├── useCopyToClipboard.ts
│   └── useKeyboardShortcuts.ts
├── i18n/                   # Internationalization (zh/en)
│   └── locales/             # Translation JSON files
├── schemas/                # Zod validation schemas
├── types/                  # TypeScript type definitions
│   └── channel.ts          # Channel types from new-api
└── utils/                  # Utility functions
    ├── modelSeries.ts      # Model series classification
    ├── encryption.ts       # Config encryption
    ├── accountIdGenerator.ts # Account ID assignment (A/B series)
    ├── connectivity.ts      # Network/endpoint helpers
    └── common.ts           # Common utilities
```

## Key Features

- **Account & Region Management**: Accounts (tier/quota/cost metadata) and regions (endpoints, API keys, enable/disable)
- **Model Management**: Master model directory + per-region model selection; series classification and coverage statistics
- **Server Credentials**: Optional Windows/Linux server login info (encrypted at rest)
- **Config Import/Export**: Encrypted JSON configuration backup and restore
- **Config History**: Local versioning (max 20) with restore and change detection
- **Audit Log**: Local audit entries with undo/redo stacks (where applicable)
- **One-Click Copy/Export**: Copy model lists and download exports for downstream usage
- **Privacy Mode**: Mask sensitive information (keys, endpoints, credentials)
- **Command Palette**: Ctrl/Cmd+K quick actions; keyboard shortcuts help
- **Dark/Light/System Theme**: Theme switching with persistence
- **i18n Support**: Chinese and English languages

## Conventions

### Code Style

- **File naming**: PascalCase for components, camelCase for utilities
- **Component structure**: Functional components with hooks
- **Exports**: Named exports preferred, barrel files (index.ts) for directories
- **Comments**: Chinese comments in source code; documentation/specs in English
- **Local-first persistence**: Prefer custom hooks that load/migrate/save localStorage state

### TypeScript

- Strict mode enabled
- Interfaces for API responses and props
- Zod schemas for runtime validation

### CSS

- Tailwind utility classes; theme is controlled via `html` class (`dark`/`light`)
- Design tokens live primarily in `tailwind.config.js` (custom `background`, `foreground`, `primary`, etc.)
- Responsive breakpoints: sm, md, lg

### Testing

- Test files in `__tests__/` subdirectories
- Naming: `*.test.ts` or `*.test.tsx`

### Local Storage Keys

- `ai-foundry-manager:accounts` (encrypted fields inside JSON)
- `ai-foundry-manager:master-models`
- `ai-foundry-manager:config-history`
- `ai-foundry-manager:audit-log`
- `ai-foundry-manager:theme`
- `ai-foundry-manager:lang`

Most of these also support migration from legacy `azure-openai-manager:*` keys.

## External Dependencies

### new-api Integration

This project includes a `new-api` client (and related types) that can integrate with [new-api](https://github.com/songquanpeng/one-api) (or one-api forks):

- **Endpoint**: Configurable, default `http://localhost:3000`
- **Auth**: Admin token required (Bearer authentication)
- **APIs used**:
  - `GET /api/channel` - List all channels
  - `GET /api/channel/fetch_models/:id` - Fetch models for a channel

Note: In development, `vite.config.ts` proxies `/api` to `http://localhost:3000` to avoid CORS.

### Azure OpenAI

- Channel type `3` indicates Azure OpenAI
- Region extracted from `base_url` (e.g., `eastus`, `westeurope`)
- Models classified by series (GPT-4, GPT-3.5, Embeddings, etc.)

## Development

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run test     # Run tests
npm run lint     # Lint code
```

Dev server defaults to port `5174` (see `vite.config.ts`).

## Notes

- Pure frontend project - no backend code
- Local-first: data lives in browser `localStorage` (encrypted for sensitive fields)
- Privacy mode recommended when sharing screens
