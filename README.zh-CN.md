# Azure AI Foundry Manager

语言: [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko.md)

> 一个本地优先、纯前端的 Azure OpenAI / Azure AI Foundry 配置管理面板：多账号、多区域、模型目录、复制导出。所有数据仅存储在浏览器 localStorage 中。

## 功能

- 账号与区域：按账号/区域组织部署信息与模型选择
- 全局模型目录：维护主模型清单，并按空行分组
- 一键复制/导出：按账号/区域/目录复制模型列表（带逗号）
- 配置导入/导出：导出加密 JSON；支持导入恢复
- 配置历史：最多 20 条历史记录
- 隐私模式：一键隐藏敏感信息
- 多语言界面：zh, en, ja, fr, de, es, pt-BR, ko
- 主题：深色 / 浅色 / 跟随系统
- 命令面板：`Ctrl/Cmd + K`

## 快速开始

前置条件：Node.js 18+、npm。

```bash
git clone https://github.com/Zeta-ZhaoLi/ai-foundry-manager.git
cd ai-foundry-manager
npm install
npm run dev
```

## 开发命令

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## 链接

- 仓库: https://github.com/Zeta-ZhaoLi/ai-foundry-manager
- Issues: https://github.com/Zeta-ZhaoLi/ai-foundry-manager/issues
