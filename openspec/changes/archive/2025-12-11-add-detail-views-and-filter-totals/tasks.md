# Tasks: Add Detail Views and Filter-Aware Totals

## Phase 1: 核心功能

### T1: 扩展 Dialog 组件支持更大尺寸
- [x] 在 `src/components/ui/Dialog.tsx` 添加 `size` prop
- [x] 支持 'sm' | 'md' | 'lg' | 'xl' | 'full' 尺寸
- [x] 更新类型定义和默认值

### T2: 创建 TableDetailDialog 组件
- [x] 创建 `src/components/ui/TableDetailDialog.tsx`
- [x] 支持全屏表格展示
- [x] 包含标题栏、关闭按钮
- [x] 可选：导出按钮、搜索框

### T3: 修改账号总览 (ModelOverviewTable) 合计逻辑
- [x] 修改 `summaryData` 计算逻辑，基于 `filteredAccounts`
- [x] 添加 `isDetailView` prop 控制表格高度
- [x] 添加详情按钮到标题行

### T4: 修改模型总览 (ModelStatisticsTable) 合计逻辑
- [x] 修改 `modelSummaryData` 计算逻辑，基于 `filteredModelStates`
- [x] 添加 `isDetailView` prop 控制表格高度
- [x] 添加详情按钮到标题行

### T5: 集成详情弹窗到 Dashboard
- [x] 在 `AzureModelsDashboard.tsx` 添加详情弹窗状态
- [x] 账号总览详情弹窗
- [x] 模型总览详情弹窗

### T6: 添加国际化翻译
- [x] zh.json: 详情、筛选结果合计
- [x] en.json: 对应英文翻译

### T7: 验证和测试
- [x] 运行 `npm run build` 确保无编译错误
- [x] 构建成功 (466.29 kB gzip: 148.98 kB)

## Phase 2: 增强功能 (后续)

### T8: 列排序功能
- [ ] 复用 `SortableHeader` 组件
- [ ] 添加排序状态管理
- [ ] 支持多列排序切换

### T9: 表格搜索
- [ ] 添加搜索输入框到详情弹窗
- [ ] 实时过滤表格数据
- [ ] 搜索关键字高亮

### T10: CSV 导出
- [ ] 创建 `exportTableToCSV` 工具函数
- [ ] 添加导出按钮
- [ ] 支持筛选后数据导出

## Phase 3: 高级功能 (后续)

### T11: 列可见性配置
- [ ] 创建列配置下拉菜单
- [ ] 持久化用户列偏好到 localStorage

### T12: 分页功能
- [ ] 添加分页组件
- [ ] 支持每页条数选择
- [ ] 保持与虚拟滚动的兼容性

## Dependencies

```
T1 (Dialog扩展) → T2 (TableDetailDialog) → T5 (集成)
T3 (账号合计) ──────────────────────────→ T5 (集成)
T4 (模型合计) ──────────────────────────→ T5 (集成)
T6 (翻译) ────────────────────────────→ T7 (测试)
```

## Verification

每个任务完成后：
1. `npm run build` 无错误 ✅
2. 相关功能可正常使用 ✅
3. 不影响现有功能 ✅
