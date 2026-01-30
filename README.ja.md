# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

> Azure OpenAI / Azure AI Foundry の構成をローカルで管理する、ブラウザ完結のダッシュボードです。データはブラウザの localStorage にのみ保存されます。

## Features

- Accounts / Regions: account・region 単位で管理
- Global Model Directory: モデル一覧を一括管理（空行でグルーピング）
- Copy / Export: モデル一覧をカンマ付きでコピー
- Import / Export: 暗号化された JSON の入出力
- Config History: 最大 20 件
- Privacy Mode: 機密情報をマスク
- UI Languages: zh, en, ja, fr, de, es, pt-BR, ko
- Theme: Dark / Light / System
- Command Palette: `Ctrl/Cmd + K`

## Getting Started

Prerequisites: Node.js 18+ and npm.

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
npm run dev
```

## Useful Commands

```bash
npm run test
npm run lint
npm run build
```

## Links

- Repo: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
