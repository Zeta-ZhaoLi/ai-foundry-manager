# Use Account IDs in Model Deployment Display

## REMOVED Requirements

### Requirement: Display Original Account IDs

模型总览表格的"部署账号"列 **MUST** 始终显示账号在原始列表中的位置，无论账号是否被禁用。

#### Scenario: 全部账号启用时的 ID 显示

**Given** 存在 3 个账号，全部启用

- 账号 1：部署了模型 A
- 账号 2：部署了模型 A, B
- 账号 3：部署了模型 B

**When** 用户查看模型总览表格

**Then** 模型 A 的"部署账号"列显示 `1, 2`
**And** 模型 B 的"部署账号"列显示 `2, 3`

#### Scenario: 部分账号禁用时的 ID 显示

**Given** 存在 3 个账号：

- 账号 1：启用，部署了模型 A
- 账号 2：**禁用**，部署了模型 A, B
- 账号 3：启用，部署了模型 B

**When** 用户查看模型总览表格

**Then** 模型 A 的"部署账号"列显示 `1`（仅显示启用账号）
**And** 模型 B 的"部署账号"列显示 `3`（显示原始 ID 3，而非重新编号为 2）

---

## MODIFIED Requirements

### Requirement: Consistent ID Reference

部署账号 ID **SHALL** 与账号总览表格中的 `accountId` 列保持一致。

#### Scenario: 跨表格 ID 一致性

**Given** 账号总览表格显示账号列表，并包含 `accountId` 列

**When** 用户查看模型总览表格中某模型的"部署账号"

**Then** 显示的账号 ID 与账号总览表格中该账号的 `accountId` 一致

#### Scenario: 双击定位功能的 ID 对应

**Given** 模型总览显示某模型部署在账号 `A017`

**When** 用户在账号总览中查找账号 `A017`

**Then** 应找到正确的账号

---

### Requirement: Only Count Enabled Accounts for Deployment

部署账号列 **MUST** 只统计启用账号中实际部署了该模型的账号。

#### Scenario: 禁用账号不计入部署统计

**Given** 账号 B002 已禁用但配置了模型 A

**When** 用户查看模型 A 的部署账号

**Then** B002 不显示在部署账号列中

#### Scenario: 所有部署账号均被禁用

**Given** 模型 A 仅部署在账号 B002，且账号 B002 已禁用

**When** 用户查看模型 A 的部署账号

**Then** 部署账号列显示 `-` 或为空

## ADDED Requirements

### Requirement: Display Account IDs (A/B Prefix)

模型总览表格的"部署账号"列 **MUST** 显示账号的 `accountId`（如 `A017`, `B030`），而不是数字序号。

#### Scenario: 部署账号显示 accountId

**Given** 存在 2 个启用账号：

- 账号 A001：部署了模型 X
- 账号 B030：部署了模型 X

**When** 用户查看模型 X 的"部署账号"列

**Then** 显示 `A001, B030`
