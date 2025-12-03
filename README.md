## Azure AI Foundry Manager

独立的前端小工具，用来对接 `new-api`，专门管理 Azure OpenAI 渠道：

- 调用 `new-api` 的 `/api/channel`、`/api/channel/fetch_models/:id` 等接口
- 只关注 `Azure OpenAI` 渠道（`type = 3`）
- 按「账号（Tag）」+「区域」聚合每个渠道的模型列表
- 支持一键复制：
  - 每个账号下所有区域模型列表（每个模型后面带一个逗号`,`）
  - 全部 Azure 渠道的总模型列表（按系列聚合后再展开）

> 说明：这是一个纯前端项目，不直接依赖 `new-api` 的 Go 代码，只通过 HTTP 请求复用其已有接口。

### 依赖前提

- 已经部署并运行 `new-api`，默认地址：`http://localhost:3000`
- 管理员账号（因为 `/api/channel` 相关接口需要管理员权限）

### 基本结构（规划）

- `src/config.ts`：`new-api` 服务地址等基础配置
- `src/api/newApiClient.ts`：封装调用 `new-api` 的 HTTP 客户端
- `src/types/channel.ts`：从 `new-api` 接口抽取的前端 `Channel` 类型
- `src/utils/modelSeries.ts`：模型系列归类与复制字符串生成函数
- `src/hooks/useAzureChannels.ts`：加载 Azure 渠道 + 聚合逻辑
- `src/components/AzureModelsDashboard.tsx`：主界面，展示账号/区域/模型列表与复制按钮
- `src/main.tsx` / `src/App.tsx`：入口与路由（单页应用）

### 运行方式（示意）

由于当前环境没有 Node/npm，本项目结构先行搭好，建议你本机安装 Node.js 后再执行：

```bash
cd azure-openai-manager
npm install
npm run dev
```

然后在浏览器访问 `http://localhost:5173`（或 Vite 输出的端口），并在页面中配置 `new-api` 地址（例如 `http://localhost:3000`）和管理员 Token。

