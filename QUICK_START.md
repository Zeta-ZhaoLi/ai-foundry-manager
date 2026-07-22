# Quick Start

## Requirements

- Node.js 22.12 or newer
- npm
- A browser with Web Crypto support

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5174`. On first launch, create a vault password of at
least 12 characters. The password is not stored and is required again after a
reload or manual lock.

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run verify
npm run test:coverage
```

`npm run verify` is the required pre-commit check. It runs lint, all tests,
TypeScript checking, and the production build.

## Backup and Restore

- **Encrypted backup** is the default export and uses a password independent of
  the local vault password.
- Importing an encrypted backup prompts for its backup password.
- **Plaintext export** contains API keys and Service Principal credentials and
  is available only after an explicit security confirmation.
- Losing a vault or backup password makes that encrypted data unrecoverable.

## Production Preview

```bash
npm run build
npm run preview
```
