# 快速开始指南

## 🎉 改进完成！

所有 12 项核心改进已成功实施。项目现已升级为企业级应用架构。

## 🚀 立即开始

### 1. 安装依赖（如果需要）
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 代码质量检查
```bash
# 检查代码问题
npm run lint

# 自动修复问题
npm run lint:fix

# 格式化代码
npm run format
```

### 4. 运行测试
```bash
# 运行所有测试
npm run test

# 测试 UI 界面
npm run test:ui
```

### 5. 生产构建
```bash
npm run build
npm run preview
```

## ✨ 新功能亮点

### 🔐 安全性增强
- **API Key 加密存储** - 所有敏感数据自动加密
- 位置：`src/utils/encryption.ts`

### 🎨 全新 UI 组件库
导入组件：
```typescript
import { Button, Card, Input, Select, Badge, Skeleton } from './components/ui';
```

组件特点：
- Tailwind CSS 样式
- 完整 TypeScript 类型
- ARIA 无障碍支持

### 📢 Toast 通知系统
```typescript
import { useToast } from './hooks/useToast';

const toast = useToast();
toast.success('操作成功！');
toast.error('出错了');
toast.info('提示信息');
```

### 📋 智能复制
```typescript
import { useCopyToClipboard } from './hooks/useCopyToClipboard';

const { copy } = useCopyToClipboard();
copy('要复制的文本', '标签');
```

### ⌨️ 快捷键支持
```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

useKeyboardShortcuts([
  {
    key: 's',
    ctrl: true,
    handler: () => console.log('Ctrl+S pressed'),
    description: '保存'
  }
]);
```

### 🌍 国际化
切换语言（准备就绪，待集成）:
```typescript
import i18n from './i18n';

i18n.changeLanguage('en'); // 或 'zh'
```

### ✅ 表单验证
```typescript
import { accountSchema, regionSchema } from './schemas/account';

// 验证数据
const result = accountSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

### 📥 配置导入/导出
```typescript
import { ConfigImportButton } from './components/ConfigImportExport/ConfigImportButton';

<ConfigImportButton onImport={(config) => {
  // 处理导入的配置
}} />
```

## 📊 项目结构

```
src/
├── components/
│   ├── ui/                    # 公共 UI 组件
│   ├── ErrorBoundary/         # 错误边界
│   ├── Toast/                 # Toast 提供者
│   └── ConfigImportExport/    # 配置管理
├── hooks/
│   ├── useToast.ts
│   ├── useCopyToClipboard.ts
│   └── useKeyboardShortcuts.ts
├── utils/
│   ├── encryption.ts          # 加密工具
│   ├── common.ts              # 通用工具
│   └── modelSeries.ts         # 模型分类
├── schemas/
│   └── account.ts             # 数据验证
└── i18n/                      # 国际化
```

## 🛡️ 错误处理

全局错误边界已自动配置在 `src/main.tsx`：

```typescript
<ErrorBoundary>
  <ToastProvider>
    <App />
  </ToastProvider>
</ErrorBoundary>
```

## 🔧 性能优化

### Debounced 保存
`useLocalAzureAccounts` hook 现在使用 500ms 防抖保存到 localStorage，避免频繁写入。

### useMemo 优化
所有计算密集型操作都使用 `useMemo` 优化，依赖数组已修复。

## 📝 代码风格

项目使用 ESLint + Prettier 统一代码风格：

```bash
# 检查所有问题
npm run lint

# 自动修复
npm run lint:fix

# 格式化
npm run format
```

## 🧪 测试

已配置 Vitest + Testing Library：

```bash
# 运行测试
npm run test

# 查看覆盖率
npm run test -- --coverage

# UI 界面
npm run test:ui
```

## 📚 更多信息

详细改进文档请查看：
- `IMPROVEMENTS.md` - 完整改进列表
- `.eslintrc.json` - ESLint 配置
- `.prettierrc.json` - Prettier 配置
- `vitest.config.ts` - 测试配置

## 💡 提示

1. **开发时**使用 `npm run dev` 启动热重载
2. **提交前**运行 `npm run lint && npm run test` 检查代码
3. **构建前**运行 `npm run format` 统一格式
4. **API Key** 会自动加密存储，无需手动处理

## 🎯 下一步

项目已经具备企业级应用基础，你可以：

1. 将现有组件迁移到新的 UI 组件库
2. 在组件中使用 useToast 替换原有的复制提示
3. 添加更多快捷键提升用户体验
4. 应用国际化到所有文本
5. 继续拆分大组件（可选）

祝开发顺利！🚀
