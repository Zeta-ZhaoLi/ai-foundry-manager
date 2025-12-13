# endpoint-normalization Specification

## Purpose
TBD - created by archiving change 2025-12-14-fix-summary-calculation-and-endpoint-normalization. Update Purpose after archive.
## Requirements
### Requirement: OpenAI Endpoint Trailing Slash Removal

OpenAI Endpoint 输入框 **MUST** 自动去除末尾的斜杠。

#### Scenario: 输入带尾部斜杠的 OpenAI Endpoint

**Given** 用户在区域配置中输入 OpenAI Endpoint

**When** 用户输入 `https://ashik-eastus2.openai.azure.com/`

**Then** 系统自动保存为 `https://ashik-eastus2.openai.azure.com`（无尾部斜杠）

#### Scenario: 输入不带斜杠的 OpenAI Endpoint

**Given** 用户在区域配置中输入 OpenAI Endpoint

**When** 用户输入 `https://ashik-eastus2.openai.azure.com`

**Then** 系统保持原样保存

---

### Requirement: Anthropic Endpoint Path Suffix Removal

Anthropic Endpoint 输入框 **MUST** 自动去除末尾的 `/v1/messages` 路径和尾部斜杠。

#### Scenario: 输入带完整路径的 Anthropic Endpoint

**Given** 用户在区域配置中输入 Anthropic Endpoint

**When** 用户输入 `https://ashik-eastus2.services.ai.azure.com/anthropic/v1/messages`

**Then** 系统自动保存为 `https://ashik-eastus2.services.ai.azure.com/anthropic`

#### Scenario: 输入带尾部斜杠的 Anthropic Endpoint

**Given** 用户在区域配置中输入 Anthropic Endpoint

**When** 用户输入 `https://ashik-eastus2.services.ai.azure.com/anthropic/`

**Then** 系统自动保存为 `https://ashik-eastus2.services.ai.azure.com/anthropic`

#### Scenario: 输入规范的 Anthropic Endpoint

**Given** 用户在区域配置中输入 Anthropic Endpoint

**When** 用户输入 `https://ashik-eastus2.services.ai.azure.com/anthropic`

**Then** 系统保持原样保存

---

### Requirement: Normalization Timing

Endpoint 规范化 **SHALL** 在用户输入后立即应用。

#### Scenario: 实时规范化

**Given** 用户正在编辑 Endpoint 字段

**When** 用户在输入框中粘贴或输入 URL

**Then** 系统在保存到状态时自动应用规范化（用户可能看到输入值被修正）

---

### Requirement: Preserve Valid URLs

规范化 **MUST NOT** 破坏有效的 URL 结构。

#### Scenario: 保留查询参数

**Given** URL 包含查询参数

**When** 用户输入 `https://example.com/api/?key=value`

**Then** 规范化后保留查询参数：`https://example.com/api?key=value`（仅去除路径末尾斜杠，保留查询参数）

#### Scenario: 处理空输入

**Given** 用户清空 Endpoint 字段

**When** 输入值为空字符串

**Then** 系统保存空字符串，不报错

