# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

Local-first dashboard for managing Azure AI Foundry/OpenAI accounts, regions, model selection, and deployment template export.

## Overview

- Pure frontend app (React + Vite), no backend required
- All data is stored in browser `localStorage`
- Sensitive values are encrypted before local persistence
- Designed for multi-account, multi-region model operations

## Core Features

### Account and Region Management

- Add and manage accounts with tier, quota, and usage metadata
- Add multiple regions per account
- Configure Foundry/OpenAI/AI Services/Anthropic endpoints per region
- Configure API Key and Resource Name per region
- Enable/disable accounts and regions, reorder with drag-and-drop

### Model Management

- Maintain a global master model directory
- Select models per region by click, plus search/filter support
- Coverage charts and model statistics views
- One-click copy for model lists

### Deployment Template Export

- Per-region model deployment table
- Editable deployment fields: include flag, model, deployment name, version, capacity
- Copy ARM deployment template with validation checks

### Productivity and Privacy

- Command palette and keyboard shortcuts
- Privacy mode to mask sensitive data on screen
- Import/export configuration JSON
- Dark/light/system theme and multilingual UI

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

### Run

```bash
npm run dev
```

Dev server default: `http://localhost:5174`

### Build and Preview

```bash
npm run build
npm run preview
```

## Usage Flow

1. Maintain models in **Global Model Directory**.
2. Add account(s), then add region(s) under each account.
3. Fill endpoint/API Key/Resource Name per region.
4. Select region models and adjust deployment table values.
5. Copy model lists or copy deployment template as needed.

## Data and Security

- Local-only storage keys:
  - `ai-foundry-manager:accounts`
  - `ai-foundry-manager:master-models`
  - `ai-foundry-manager:theme`
  - `ai-foundry-manager:lang`
- Sensitive fields (for example API keys) are encrypted before storage.
- Privacy mode masks sensitive UI values for safer screen sharing.

## Optional/Internal Integration Notes

- The repository may contain optional/internal integration-related settings for local development.
- Core usage does not require connecting to any backend service.

## Supported UI Languages

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## Development

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Project Structure (Main)

```text
src/
  components/      UI and dashboard modules
  hooks/           local state and persistence hooks
  i18n/            locale files and i18n setup
  utils/           shared utilities
  contexts/        React contexts
openspec/          change proposals and specifications
```

## License

MIT License. See `LICENSE`.

## Author

- 赵利利 (ZetaTechs)
- Repository: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
