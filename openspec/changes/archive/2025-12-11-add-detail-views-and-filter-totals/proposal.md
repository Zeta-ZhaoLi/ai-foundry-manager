# Add Detail Views and Filter-Aware Totals

## Why

当前账号总览和模型总览两个板块都是嵌入式表格，存在以下问题：

1. **表格空间有限**：在卡片式布局中，表格高度固定（max-h-64），当数据量较大时查看不便
2. **合计行不随筛选变化**：当前合计行（summaryData）始终基于全量数据计算，用户筛选后无法看到筛选结果的汇总统计
3. **缺乏详情入口**：用户无法在独立页面/弹窗中查看完整表格，进行更深入的数据分析

## What Changes

### 核心功能

1. **详情按钮**：在账号总览、模型总览两个板块的右上角添加【详情】按钮
2. **详情弹窗/页面**：点击后展示完整表格，支持更大的视图空间
3. **筛选感知合计**：合计行根据当前筛选条件动态计算，显示筛选后的汇总数据

### 扩展功能（规划）

4. **表格导出**：支持导出 CSV/Excel 格式
5. **列排序**：点击表头进行升序/降序排序
6. **列可见性**：用户可选择显示/隐藏特定列
7. **搜索框**：快速搜索账号名/模型名
8. **分页**：大数据量时提供分页选项

## Affected Areas

- `src/components/Dashboard/ModelOverviewTable.tsx` - 账号总览表格
- `src/components/Dashboard/ModelStatisticsTable.tsx` - 模型总览表格
- `src/components/ui/Dialog.tsx` - 需要支持更大尺寸的对话框
- `src/i18n/locales/*.json` - 新增翻译文案

## Out of Scope

- 服务端数据获取（当前为纯前端方案）
- 打印功能
- 图表详情视图
