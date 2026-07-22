# Azure AI Foundry Manager

Languages: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

一个本地优先的 Azure AI Foundry/OpenAI 配置管理面板，用于管理账号、区域、模型选择与部署模板导出。

## 概览

- 纯前端应用（React + Vite），无需后端
- 业务配置存储在浏览器的加密保险库中
- 保险库由用户口令保护，页面重新加载后需要再次解锁
- 面向多账号、多区域的模型配置场景

## 核心功能

### 账号与区域管理

- 管理账号的类别、额度与使用信息
- 每个账号可配置多个区域
- 每个区域配置 Foundry/OpenAI/AI Services/Anthropic Endpoint
- 每个区域独立配置 API Key 与 Resource Name
- 支持账号/区域启用开关与拖拽排序

### 模型管理

- 维护全局主模型目录
- 在区域内点击选择模型，支持搜索与筛选
- 提供覆盖率图表和模型统计视图
- 支持一键复制模型列表

### 部署模板导出

- 区域级模型部署表格
- 可编辑部署字段：加入、模型、部署名称、版本、容量
- 支持校验后复制 ARM 部署模板

### 效率与隐私

- 命令面板与快捷键
- 隐私模式（遮罩敏感信息）
- 配置 JSON 导入/导出
- 深色/浅色/跟随系统主题与多语言 UI

## 快速开始

### 环境要求

- Node.js 22.12+
- npm

### 安装

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
```

首次打开时需要设置至少 12 个字符的保险库口令。旧版配置仅在成功解密并通过校验后迁移。

### 启动开发

```bash
npm run dev
```

默认地址：`http://localhost:5174`

### 构建与预览

```bash
npm run build
npm run preview
```

## 使用流程

1. 在 **Global Model Directory** 维护主模型列表。
2. 新增账号，并在账号下新增区域。
3. 为每个区域填写 Endpoint / API Key / Resource Name。
4. 选择区域模型并调整部署表格参数。
5. 按需复制模型列表或部署模板。

## 数据与安全

- 账号、Endpoint、模型、API Key 和 Service Principal 数据使用
  PBKDF2-SHA-256 与 AES-256-GCM 加密在 `ai-foundry-manager:vault:v2` 中。
- 保险库口令与派生密钥只保留在当前页面内存，不会写入存储。
- 页面重新加载或手动锁定后需要再次输入口令；忘记口令后应用无法恢复数据。
- 配置默认导出为使用独立口令保护的加密备份；明文导出仅作为显式高级恢复操作。
- 旧版账号原始数据会保留到迁移成功，损坏或无法解密的数据不会被默认配置覆盖。
- 隐私模式可在共享屏幕时隐藏敏感信息。

## 可选/内部集成说明

- 仓库中可能包含本地开发使用的可选/内部集成相关配置。
- 日常核心使用不依赖任何后端服务。

## 支持的 UI 语言

- `zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`

## 开发命令

```bash
npm run dev
npm run lint
npm run test:run
npm run build
npm run verify
npm run test:coverage
```

## 项目结构（主要）

```text
src/
  components/      UI 与仪表盘模块
  hooks/           本地状态与持久化 hooks
  i18n/            多语言资源与初始化
  utils/           通用工具
  contexts/        React 上下文
openspec/          变更提案与规格文档
```

## 许可证

MIT License，见 `LICENSE`。

## 作者

- 赵利利 (ZetaTechs)
- 仓库: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- 问题反馈: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
