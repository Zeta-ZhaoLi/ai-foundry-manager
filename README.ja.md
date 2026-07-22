# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

Azure AI Foundry/OpenAI のアカウント・リージョン・モデル選択・デプロイテンプレート出力を管理する、ローカルファーストのダッシュボードです。

## 概要

- 純フロントエンド（React + Vite）、バックエンド不要
- データはブラウザ `localStorage` に保存
- 機密情報はローカル保存前に暗号化
- 複数アカウント/複数リージョン運用を想定

## 主な機能

### アカウントとリージョン管理

- アカウントの種別、クォータ、利用状況を管理
- 各アカウントに複数リージョンを追加
- 各リージョンに Foundry/OpenAI/AI Services/Anthropic Endpoint を設定
- 各リージョンに API Key と Resource Name を設定
- 有効/無効切り替え、ドラッグ&ドロップ並び替え

### モデル管理

- グローバルのマスターモデルディレクトリ
- リージョンごとのクリック選択（検索・フィルタ対応）
- カバレッジチャートとモデル統計
- モデル一覧のワンクリックコピー

### デプロイテンプレート出力

- リージョン単位のモデルデプロイ表
- 編集可能項目: 含める、モデル、デプロイ名、バージョン、容量
- バリデーション後に ARM テンプレートをコピー

### 生産性とプライバシー

- コマンドパレットとキーボードショートカット
- プライバシーモード（機密情報マスク）
- 設定 JSON のインポート/エクスポート
- ダーク/ライト/システムテーマと多言語 UI

## クイックスタート

### 前提

- Node.js 22.12+
- npm

### インストール

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

### 開発起動

```bash
npm run dev
```

既定 URL: `http://localhost:5174`

### ビルドとプレビュー

```bash
npm run build
npm run preview
```

## 利用フロー

1. **Global Model Directory** でマスターモデルを管理
2. アカウントを追加し、配下にリージョンを追加
3. 各リージョンに Endpoint / API Key / Resource Name を入力
4. モデル選択とデプロイ表の値を調整
5. モデル一覧またはデプロイテンプレートをコピー

## データとセキュリティ

- 主要ローカルストレージキー:
  - `ai-foundry-manager:accounts`
  - `ai-foundry-manager:master-models`
  - `ai-foundry-manager:theme`
  - `ai-foundry-manager:lang`
- API キーなどの機密項目は暗号化して保存
- 画面共有時はプライバシーモードを推奨

## オプション/内部連携について

- リポジトリには開発用のオプション/内部連携設定が含まれる場合があります。
- コア機能の利用にバックエンド接続は必須ではありません。

## 対応 UI 言語

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## 開発コマンド

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## 主要ディレクトリ

```text
src/
  components/      UI とダッシュボード
  hooks/           ローカル状態/永続化
  i18n/            翻訳リソース
  utils/           共通ユーティリティ
  contexts/        React コンテキスト
openspec/          変更提案と仕様
```

## ライセンス

MIT License（`LICENSE` 参照）。

## 作者

- 赵利利 (ZetaTechs)
- Repository: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
