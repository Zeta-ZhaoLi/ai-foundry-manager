# Account Summary Calculation

## Overview

账号总览表格合计行的成本计算逻辑规范。

## MODIFIED Requirements

### Requirement: Account Cost Summary Calculation

账号总览合计行的"账号成本/$"**MUST** 显示总购买金额除以总额度，而非平均值。

#### Scenario: 计算多账号的账号成本合计

**Given** 存在多个参与统计的账号：
- 账号A：购买金额 ¥1000，额度 $200
- 账号B：购买金额 ¥2000，额度 $1000

**When** 用户查看账号总览合计行

**Then** 账号成本显示为 `¥3000 / $1200 = ¥2.50`（总购买金额除以总额度）

---

### Requirement: Actual Cost Summary Calculation

账号总览合计行的"实际成本/$"**MUST** 显示总购买金额除以总已使用额度，而非平均值。

#### Scenario: 计算多账号的实际成本合计

**Given** 存在多个参与统计的账号：
- 账号A：购买金额 ¥1000，已使用 $100
- 账号B：购买金额 ¥2000，已使用 $500

**When** 用户查看账号总览合计行

**Then** 实际成本显示为 `¥3000 / $600 = ¥5.00`（总购买金额除以总已使用）

---

### Requirement: Mixed Currency Cost Calculation

当账号使用不同币种购买时，合计行 **SHALL** 分别显示各币种的成本。

#### Scenario: 混合币种账号成本计算

**Given** 存在使用不同币种的账号：
- 账号A：购买金额 $100，额度 $200
- 账号B：购买金额 ¥1000，额度 $500

**When** 用户查看账号总览合计行

**Then** 账号成本应分别显示：
- USD 部分：`$100 / $200 = $0.50`
- CNY 部分：`¥1000 / $500 = ¥2.00`

#### Scenario: 仅有单一币种时的简化显示

**Given** 所有账号使用同一币种（如 CNY）

**When** 用户查看账号总览合计行

**Then** 成本直接显示单一币种结果，如 `¥2.50`

---

### Requirement: Summary Row Display Format

合计行的成本显示 **MUST NOT** 使用平均值前缀（~）。

#### Scenario: 成本值显示格式

**Given** 合计行计算完成

**When** 显示账号成本和实际成本

**Then** 显示格式为 `¥X.XX` 或 `$X.XX`，不带 `~` 前缀
