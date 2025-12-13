# Fix Summary Calculation and Endpoint Normalization

## Summary

本提案修复账号总览合计行的成本计算公式，添加 Endpoint 输入自动规范化功能，并修正模型总览表格中部署账号 ID 的显示逻辑。

## Motivation

1. **账号成本和实际成本计算逻辑错误**：当前实现使用平均值计算合计行的账号成本和实际成本，但用户期望的是总购买金额除以总额度/总已使用。
2. **Endpoint 输入不规范**：用户经常在 Endpoint 末尾带有不必要的斜杠或路径后缀，需要自动清理。
3. **模型总览账号 ID 显示问题**：当前"部署账号"列显示的 ID 会根据启用状态变化，但应显示实际账号 ID（包括禁用账号）。

## Changes Overview

### 1. 账号总览合计行计算公式修复

**当前行为**：
- 账号成本合计 = 各账号成本的平均值 (`avgAccountCost`)
- 实际成本合计 = 各账号实际成本的平均值 (`avgActualCost`)

**期望行为**：
- 账号成本合计 = 总购买金额 / 总额度
- 实际成本合计 = 总购买金额 / 总已使用

### 2. Endpoint 输入自动规范化

**OpenAI Endpoint**：
- 自动去除末尾斜杠
- 例：`https://ashik-eastus2.openai.azure.com/` → `https://ashik-eastus2.openai.azure.com`

**Anthropic Endpoint**：
- 自动去除末尾的 `/v1/messages` 路径
- 自动去除末尾斜杠
- 例：`https://ashik-eastus2.services.ai.azure.com/anthropic/v1/messages` → `https://ashik-eastus2.services.ai.azure.com/anthropic`

### 3. 模型总览表格部署账号 ID 显示

**当前行为**：
- 部署账号列显示账号索引（基于过滤后的启用账号列表）

**期望行为**：
- 部署账号列显示实际账号 ID（原始列表中的索引）
- 即使账号被禁用，也应显示该账号在原始列表中的真实位置

## Files Affected

| File | Changes |
|------|---------|
| `src/components/Dashboard/ModelOverviewTable.tsx` | 修改合计行成本计算逻辑 |
| `src/hooks/useLocalAzureAccounts.ts` | 添加 Endpoint 规范化函数并在更新时调用 |
| `src/components/Dashboard/ModelStatisticsTable.tsx` | 修改部署账号 ID 显示逻辑 |
| `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` | 在 Endpoint 输入时调用规范化 |

## Testing

1. 账号总览合计行验证：
   - 添加多个账号，设置不同购买金额和额度
   - 验证合计行"账号成本"= 总购买金额 / 总额度
   - 验证合计行"实际成本"= 总购买金额 / 总已使用

2. Endpoint 规范化验证：
   - 输入带尾部斜杠的 OpenAI Endpoint，验证自动去除
   - 输入带 `/v1/messages` 的 Anthropic Endpoint，验证自动去除

3. 模型部署账号 ID 验证：
   - 创建多个账号（部分禁用），验证模型总览中 ID 显示为原始账号位置

## Risks/Considerations

- 成本计算公式变更可能影响用户对数据的理解，但新公式更符合"总体成本"的语义
- Endpoint 规范化是非破坏性的，只去除冗余后缀，不会改变有效的 URL
