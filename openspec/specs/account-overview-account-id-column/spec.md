# account-overview-account-id-column Specification

## Purpose
TBD - created by archiving change 2026-01-30-remove-global-summary-and-expand-master-directory-copy. Update Purpose after archive.
## Requirements
### Requirement: Account Overview Includes Account ID Column

账号总览表格 MUST 增加一列用于显示账号的 `accountId`（如 `A017`, `B030`）。

#### Scenario: 账号总览显示 accountId

**Given** 账号总览表格已渲染

**And** 存在账号 `A017`

**When** 用户查看该账号所在行

**Then** 表格中 MUST 存在 "Account ID" / "账号ID" 列

**And** 该列显示 `A017`

