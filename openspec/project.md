# Project Context

## Overview

**AI Foundry Manager** is a standalone frontend tool for managing Azure OpenAI channels in new-api/one-api systems. It provides visual management of Azure OpenAI model configurations, aggregated by account (tag) and region.

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | TypeScript (strict mode) |
| Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| State Management | React hooks (useState, useContext) |
| HTTP Client | Custom fetch wrapper (`src/api/newApiClient.ts`) |
| Internationalization | i18next + react-i18next |
| Validation | Zod |
| Testing | Vitest + React Testing Library |
| Drag & Drop | @dnd-kit |
| Linting | ESLint + Prettier |

## Project Structure

```
src/
├── api/                    # API client for new-api integration
│   └── newApiClient.ts
├── components/
│   ├── Dashboard/          # Main dashboard components
│   │   ├── AccountConfiguration/  # Account & region management
│   │   ├── Charts/               # Visualization (Donut, Bar)
│   │   ├── CoverageCharts/       # Model & region coverage
│   │   └── Summary/              # Account & global summaries
│   ├── ui/                 # Reusable UI components (Button, Card, Dialog, etc.)
│   ├── ConfigImportExport/ # Config import/export functionality
│   ├── ErrorBoundary/      # Error handling
│   └── Toast/              # Toast notifications
├── contexts/               # React contexts (ThemeContext)
├── hooks/                  # Custom hooks
│   ├── useAzureChannels.ts # Channel data fetching & aggregation
│   ├── useLocalAzureAccounts.ts
│   ├── useCopyToClipboard.ts
│   └── useKeyboardShortcuts.ts
├── i18n/                   # Internationalization (zh/en)
├── schemas/                # Zod validation schemas
├── types/                  # TypeScript type definitions
│   └── channel.ts          # Channel types from new-api
└── utils/                  # Utility functions
    ├── modelSeries.ts      # Model series classification
    ├── encryption.ts       # Config encryption
    └── common.ts           # Common utilities
```

## Key Features

- **Channel Management**: View and manage Azure OpenAI channels (type=3) from new-api
- **Account Aggregation**: Group channels by account tag and Azure region
- **Model Directory**: Master model list with series classification
- **One-Click Copy**: Copy model lists per account/region or all models
- **Privacy Mode**: Hide sensitive information (API keys, endpoints)
- **Dark/Light/System Theme**: Theme switching with persistence
- **i18n Support**: Chinese and English languages
- **Config Import/Export**: Encrypted configuration backup

## Conventions

### Code Style

- **File naming**: PascalCase for components, camelCase for utilities
- **Component structure**: Functional components with hooks
- **Exports**: Named exports preferred, barrel files (index.ts) for directories
- **Comments**: Chinese comments in codebase (project author preference)

### TypeScript

- Strict mode enabled
- Interfaces for API responses and props
- Zod schemas for runtime validation

### CSS

- Tailwind utility classes
- Dark-first design (bg-gray-900 default)
- Responsive breakpoints: sm, md, lg

### Testing

- Test files in `__tests__/` subdirectories
- Naming: `*.test.ts` or `*.test.tsx`

## External Dependencies

### new-api Integration

This tool integrates with [new-api](https://github.com/songquanpeng/one-api) (or one-api forks):

- **Endpoint**: Configurable, default `http://localhost:3000`
- **Auth**: Admin token required (Bearer authentication)
- **APIs used**:
  - `GET /api/channel` - List all channels
  - `GET /api/channel/fetch_models/:id` - Fetch models for a channel

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

## Notes

- Pure frontend project - no backend code
- Designed for admin users of new-api systems
- Privacy mode recommended when sharing screens
