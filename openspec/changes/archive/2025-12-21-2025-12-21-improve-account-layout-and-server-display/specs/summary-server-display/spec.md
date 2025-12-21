# Summary Server Display - Infrastructure Visibility in Overview

## ADDED Requirements

### Requirement: Account Summary Must Display Server Names

The Account Summary section **MUST** include columns showing Windows and Linux server names for each account.

**Rationale:** Users need to see server deployment topology at a glance in the summary view, without navigating to individual account cards. This enables quick infrastructure auditing and capacity planning.

#### Scenario: Account Summary Shows Windows Server Column

**Given** the Account Summary is displayed
**When** an account has Windows server with serverName "WinHost-01"
**Then** the summary **MUST** display a "Windows 服务器" column
**And** the account row **MUST** show "WinHost-01" in that column

#### Scenario: Account Summary Shows Linux Server Column

**Given** the Account Summary is displayed
**When** an account has Linux server with serverName "LinuxAPI-01"
**Then** the summary **MUST** display a "Linux 服务器" column
**And** the account row **MUST** show "LinuxAPI-01" in that column

#### Scenario: Account Summary Shows Empty Server Placeholder

**Given** the Account Summary is displayed
**When** an account has no Windows server configured
**Then** the Windows server column **MUST** display "未配置" or equivalent placeholder
**And** the placeholder **MUST** maintain column alignment

#### Scenario: Account Summary Aligns Server Columns

**Given** multiple accounts are shown in Account Summary
**And** some accounts have server names while others don't
**When** viewing the summary table
**Then** all Windows server values **MUST** align vertically in their column
**And** all Linux server values **MUST** align vertically in their column
**And** placeholder values **MUST** align with actual values

### Requirement: Model Overview Must Display Deployment Server

The Model Overview table **MUST** include a "部署服务器" column showing which Linux server(s) each model is deployed on.

**Rationale:** Users need to see API deployment topology per model, enabling quick identification of where each model's endpoints are hosted. This is critical for load balancing, failover planning, and troubleshooting.

#### Scenario: Model Overview Shows Single Deployment Server

**Given** a model is deployed on a single Linux server "LinuxAPI-01"
**When** viewing the Model Overview table
**Then** the "部署服务器" column for that model **MUST** show "LinuxAPI-01"

#### Scenario: Model Overview Shows Multiple Deployment Servers

**Given** a model is deployed on two Linux servers "LinuxAPI-01" and "LinuxAPI-02"
**When** viewing the Model Overview table
**Then** the "部署服务器" column for that model **MUST** show both servers
**And** the servers **MUST** be comma-separated or displayed as a list

#### Scenario: Model Overview Shows No Deployment Server

**Given** a model's accounts have no Linux server configured
**When** viewing the Model Overview table
**Then** the "部署服务器" column for that model **MUST** show "未配置"
**And** the placeholder **MUST** maintain column alignment

#### Scenario: Model Overview Derives Server from Linux Credentials

**Given** an account has a region with models ["gpt-4o", "gpt-4o-mini"]
**And** the account's Linux server has serverName "LinuxAPI-01"
**When** viewing the Model Overview table
**Then** both "gpt-4o" and "gpt-4o-mini" **MUST** show "LinuxAPI-01" in the deployment server column

### Requirement: Summary Views Must Update When Server Names Change

When a user updates a server name in account configuration, the change **MUST** immediately reflect in the Account Summary and Model Overview.

**Rationale:** Summary views provide real-time infrastructure state. Stale data could lead to misconfigurations or incorrect capacity planning decisions.

#### Scenario: Account Summary Updates After Server Name Change

**Given** an account has Windows server "OldServer"
**And** the Account Summary displays "OldServer" for this account
**When** the user changes the Windows server name to "NewServer"
**And** saves the account
**Then** the Account Summary **MUST** immediately show "NewServer"

#### Scenario: Model Overview Updates After Server Name Change

**Given** a model "gpt-4o" is deployed on server "OldServer"
**And** the Model Overview displays "OldServer" for this model
**When** the user changes the Linux server name to "NewServer"
**And** saves the account
**Then** the Model Overview **MUST** immediately show "NewServer" for "gpt-4o"

### Requirement: Summary Server Columns Must Support Sorting and Filtering

Users **MUST** be able to sort and filter by server name columns in both Account Summary and Model Overview.

**Rationale:** When managing many accounts/models, users need to quickly find all accounts on a specific server or sort by server name for organized viewing.

#### Scenario: Account Summary Sortable by Windows Server

**Given** the Account Summary displays multiple accounts with various Windows servers
**When** the user clicks the "Windows 服务器" column header
**Then** the accounts **MUST** be sorted alphabetically by Windows server name
**And** accounts with "未配置" **MUST** appear at the end

#### Scenario: Model Overview Sortable by Deployment Server

**Given** the Model Overview displays multiple models with various deployment servers
**When** the user clicks the "部署服务器" column header
**Then** the models **MUST** be sorted alphabetically by Linux server name
**And** models with "未配置" **MUST** appear at the end

#### Scenario: Model Overview Filterable by Deployment Server

**Given** the Model Overview displays models across multiple servers
**When** the user enters "LinuxAPI-01" in a deployment server filter
**Then** only models deployed on "LinuxAPI-01" **MUST** be shown
**And** other models **MUST** be hidden
