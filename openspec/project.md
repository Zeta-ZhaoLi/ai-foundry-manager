# Project Context

## Overview

**AI Foundry Manager** is a local-first React dashboard for maintaining Azure AI
Foundry accounts, regional endpoints, model selections, deployment metadata,
and deployment artifacts. It has no application backend.

Primary workflows:

- Maintain a global model directory and per-account/per-region selections.
- Configure Foundry, OpenAI, AI Services, and Anthropic endpoints.
- Generate ARM, Azure CLI Bash, and Azure CLI PowerShell deployment artifacts.
- Import deployment result reports and configuration JSON files.

## Technology

| Category | Technology |
| --- | --- |
| Language | TypeScript, strict mode |
| UI | React 18, Vite 5, Tailwind CSS 3 |
| Runtime validation | Zod 4 |
| Persistence | Browser localStorage with versioned config validation |
| Cryptography | CryptoJS AES for locally stored sensitive fields |
| Internationalization | i18next and react-i18next, 8 locales |
| Drag and drop | dnd-kit |
| Virtualization | TanStack React Virtual |
| Testing | Vitest and React Testing Library |

## Source Structure

```text
src/
  components/       Dashboard, account configuration, and shared UI
  contexts/         Theme state
  hooks/            Account operations and keyboard shortcuts
  persistence/      Versioned config parsing and legacy migration
  schemas/          Runtime data contracts
  i18n/             Locale resources and lazy locale loading
  utils/            ARM, CLI, report, model, and compatibility utilities
```

## Data and Security Contract

- Accounts are stored at `ai-foundry-manager:accounts`; the master model
  directory and default region template use separate localStorage keys.
- Service Principal passwords and region API keys are encrypted before local
  persistence and decrypted when accounts are loaded.
- Legacy account storage and the recovery backup left by the former vault
  migration remain supported as fallback read sources.
- Configuration import and export use JSON. Exports contain plaintext secrets
  and require an explicit warning before download.
- Theme and language preferences are non-sensitive and remain separate.

## Conventions

- PascalCase component files; camelCase utilities; named exports preferred.
- Chinese source comments are allowed; specifications and proposals are English.
- Add runtime validation at persistence, import, and external-data boundaries.
- Keep Azure CLI, PowerShell, ARM, and deployment report generators pure and
  cover exact output contracts with tests.
- Changes that add capabilities or alter persistence follow the OpenSpec proposal
  workflow in `openspec/AGENTS.md`.

## Development

Node.js 22.12 or newer is required.

```bash
npm install
npm run dev
npm run verify
npm run test:coverage
```

`npm run verify` enforces zero-warning ESLint, complete Vitest execution,
TypeScript checking, and a production Vite build. Every emitted JavaScript
chunk must remain at or below 500 kB.
