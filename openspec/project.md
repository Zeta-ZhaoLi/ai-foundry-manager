# Project Context

## Overview

**AI Foundry Manager** is a local-first React dashboard for maintaining Azure AI
Foundry accounts, regional endpoints, model selections, deployment metadata,
and deployment artifacts. It has no application backend.

Primary workflows:

- Maintain a global model directory and per-account/per-region selections.
- Configure Foundry, OpenAI, AI Services, and Anthropic endpoints.
- Generate ARM, Azure CLI Bash, and Azure CLI PowerShell deployment artifacts.
- Import deployment result reports and encrypted configuration backups.

## Technology

| Category | Technology |
| --- | --- |
| Language | TypeScript, strict mode |
| UI | React 18, Vite 5, Tailwind CSS 3 |
| Runtime validation | Zod 4 |
| Persistence | Versioned encrypted browser vault |
| Cryptography | Web Crypto PBKDF2-SHA-256 and AES-256-GCM |
| Internationalization | i18next and react-i18next, 8 locales |
| Drag and drop | dnd-kit |
| Virtualization | TanStack React Virtual |
| Testing | Vitest and React Testing Library |

## Source Structure

```text
src/
  components/       Dashboard, account configuration, UI, and vault screens
  contexts/         Theme and encrypted vault state
  hooks/            Account operations and keyboard shortcuts
  persistence/      Versioned config parsing and legacy migration
  schemas/          Runtime data contracts
  security/         Web Crypto envelope implementation
  i18n/             Locale resources and lazy locale loading
  utils/            ARM, CLI, report, model, and compatibility utilities
```

## Data and Security Contract

- Operational configuration is stored at `ai-foundry-manager:vault:v2`.
- Vault and backup passwords are never persisted. Reloading requires unlock.
- The complete account configuration is authenticated with AES-GCM; encryption,
  decryption, or validation failures must never fall back to plaintext.
- Legacy account data is copied to
  `ai-foundry-manager:accounts:legacy-backup` before migration and is removed
  from active legacy keys only after V2 persistence succeeds.
- Encrypted backups are the default. Plaintext export requires an explicit
  warning and is retained only for recovery and interoperability.
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
