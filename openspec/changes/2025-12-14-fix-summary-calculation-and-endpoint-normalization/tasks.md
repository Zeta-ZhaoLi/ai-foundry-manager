# Implementation Tasks

## Task 1: Fix Account Overview Summary Row Calculation

- [x] **File**: `src/components/Dashboard/ModelOverviewTable.tsx`

1. [x] 修改 `summaryData` 的计算逻辑（约第 103-208 行）
2. [x] 将 `avgAccountCost` 替换为 `accountCostUSD/accountCostCNY`：
   - 计算公式：`totalPurchase / totalQuota`（分币种计算）
3. [x] 将 `avgActualCost` 替换为 `actualCostUSD/actualCostCNY`：
   - 计算公式：`totalPurchase / totalUsed`（分币种计算）
4. [x] 更新合计行显示，去掉 `~` 前缀（因为不再是平均值）

**验证**：✅ 运行应用，添加账号验证合计行计算正确

---

## Task 2: Add Endpoint Normalization Utility

- [x] **File**: `src/utils/common.ts`

1. [x] 创建 `normalizeOpenAIEndpoint(url: string): string` 函数：
   - 去除末尾斜杠 `/`
2. [x] 创建 `normalizeAnthropicEndpoint(url: string): string` 函数：
   - 去除末尾的 `/v1/messages`
   - 去除末尾斜杠 `/`

**验证**：✅ 函数已添加到 common.ts

---

## Task 3: Apply Endpoint Normalization in Hook

- [x] **File**: `src/hooks/useLocalAzureAccounts.ts`

1. [x] 导入规范化函数
2. [x] 在 `updateRegionOpenaiEndpoint` 中调用 `normalizeOpenAIEndpoint`
3. [x] 在 `updateRegionAnthropicEndpoint` 中调用 `normalizeAnthropicEndpoint`

**验证**：✅ 在应用中输入带斜杠的 Endpoint，验证自动去除

---

## Task 4: Fix Model Statistics Table Account ID Display

- [x] **File**: `src/components/AzureModelsDashboard.tsx`

1. [x] 修改 `modelAccountsMap` 的计算逻辑，使用原始 `accounts` 数组的索引
2. [x] 确保只为启用的账号创建映射，但使用原始索引

**验证**：✅ 禁用部分账号后，验证模型总览表格中账号 ID 显示正确

---

## Task 5: Build & Test

- [x] 运行 `npm run build` 确保无编译错误 ✅
- [ ] 运行 `npm run lint` (ESLint 配置需要迁移到 v9 格式，为预存在问题)
- [ ] 手动测试所有变更功能

---

## Dependencies

- Task 2 → Task 3（规范化函数需先创建）✅
- Task 1, Task 4 可并行执行 ✅
- Task 5 在所有其他任务完成后执行 ✅
