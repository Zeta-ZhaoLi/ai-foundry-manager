# Design: Detail Views and Filter-Aware Totals

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AzureModelsDashboard                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │  ModelOverviewTable │  │ModelStatisticsTable │          │
│  │  (账号总览)         │  │  (模型总览)         │          │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │          │
│  │  │ [详情] Button │  │  │  │ [详情] Button │  │          │
│  │  └───────────────┘  │  │  └───────────────┘  │          │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │          │
│  │  │  Filter Chips │  │  │  │  Filter Chips │  │          │
│  │  └───────────────┘  │  │  └───────────────┘  │          │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │          │
│  │  │ Table (short) │  │  │  │ Table (short) │  │          │
│  │  └───────────────┘  │  │  └───────────────┘  │          │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │          │
│  │  │Summary (filt.)│  │  │  │Summary (filt.)│  │          │
│  │  └───────────────┘  │  │  └───────────────┘  │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │   TableDetailDialog     │
                │  ┌───────────────────┐  │
                │  │   Full Table      │  │
                │  │   + Search        │  │
                │  │   + Sort          │  │
                │  │   + Export        │  │
                │  │   + Filter-aware  │  │
                │  │     Summary       │  │
                │  └───────────────────┘  │
                └─────────────────────────┘
```

## Design Decisions

### D1: 详情展示方式 - 使用 Dialog 而非路由

**选择**: 使用全屏 Dialog 弹窗

**理由**:
- 保持 SPA 单页应用的流畅体验
- 不需要引入路由状态管理
- 用户可以快速返回概览视图
- 弹窗内可复用现有表格组件

**替代方案**:
- 新建独立页面 + React Router：增加复杂度，需要状态同步
- 侧边抽屉 Drawer：空间可能仍然不足

### D2: 合计行数据源 - 基于筛选后数据

**选择**: 合计行始终基于 `filteredAccounts` / `filteredModelStates`

**实现**:
```typescript
// Before (基于全量数据)
const summaryData = useMemo(() => {
  const accs = statsAccounts; // 全量
  // ...计算
}, [statsAccounts]);

// After (基于筛选后数据)
const summaryData = useMemo(() => {
  const accs = filteredAccounts.filter(a => a.includeInStats !== false);
  // ...计算
}, [filteredAccounts]);
```

**理由**:
- 用户筛选时更关心筛选结果的统计
- 提供更直观的数据反馈
- 可选添加"全量统计"的提示或切换

### D3: Dialog 尺寸 - 支持 xl/full 尺寸

**选择**: 扩展 Dialog 组件支持更大尺寸

**新增尺寸**:
```typescript
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// xl: max-w-5xl (1024px)
// full: max-w-[90vw] max-h-[90vh]
```

### D4: 表格增强功能 - 渐进式实现

**Phase 1 (本次)**:
- 详情按钮 + Dialog
- 筛选感知合计

**Phase 2 (后续)**:
- 列排序
- 搜索框
- CSV 导出

**Phase 3 (后续)**:
- 列可见性配置
- 分页
- 持久化用户偏好

## Component Structure

### TableDetailDialog (新组件)

```typescript
interface TableDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  // 可选增强功能
  onExport?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}
```

### 改造点

1. **ModelOverviewTable**:
   - 添加 `showDetailButton?: boolean` prop
   - 添加 `isDetailView?: boolean` prop (详情模式下移除高度限制)
   - 修改 `summaryData` 计算逻辑

2. **ModelStatisticsTable**:
   - 同上改造

3. **Dialog**:
   - 添加 `size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'` prop

## Data Flow

```
User clicks filter → filteredAccounts updates → summaryData recalculates
                                              ↓
                                        合计行更新显示筛选后的汇总
```

## Accessibility

- Dialog 支持 Escape 关闭
- 焦点管理：打开时聚焦到 Dialog，关闭时返回触发按钮
- 表格支持键盘导航
- 合计行明确标注"筛选结果合计"
