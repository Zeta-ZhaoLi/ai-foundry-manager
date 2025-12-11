# Table Detail Views and Filter-Aware Totals

## Purpose

为账号总览和模型总览表格提供详情弹窗功能，支持全屏查看完整表格，并确保合计行根据筛选条件动态更新。
## Requirements

(Requirements will be populated by the archive process)

### Requirement: Detail View Button
账号总览和模型总览板块的标题行右侧 SHALL 显示【详情】按钮。

#### Scenario: 用户查看账号总览详情
Given 用户在 Dashboard 页面
And 账号总览板块已渲染
When 用户点击账号总览的【详情】按钮
Then 系统 SHALL 打开全屏 Dialog 弹窗
And 弹窗内 SHALL 显示完整的账号表格（无高度限制）
And SHALL 保留当前筛选状态

#### Scenario: 用户查看模型总览详情
Given 用户在 Dashboard 页面
And 模型总览板块已渲染
When 用户点击模型总览的【详情】按钮
Then 系统 SHALL 打开全屏 Dialog 弹窗
And 弹窗内 SHALL 显示完整的模型表格（无高度限制）
And SHALL 保留当前筛选状态

### Requirement: Filter-Aware Summary Row
表格底部的合计行 MUST 根据当前筛选条件动态计算。

#### Scenario: 账号总览筛选后合计更新
Given 用户在账号总览板块
And 当前显示 10 个账号
When 用户点击"高级"筛选按钮
And 只剩 3 个高级账号显示
Then 合计行 SHALL 只统计这 3 个账号的数据
And 合计行标签 SHOULD 显示"筛选结果合计"或类似提示

#### Scenario: 模型总览筛选后合计更新
Given 用户在模型总览板块
And 当前显示 50 个模型
When 用户点击"未使用"筛选按钮
And 只剩 5 个未使用模型显示
Then 合计行 SHALL 只统计这 5 个模型的数据

#### Scenario: 清除筛选恢复全量合计
Given 用户已应用筛选条件
And 合计行显示筛选结果
When 用户点击"全部"筛选按钮
Then 合计行 SHALL 恢复显示全量数据统计

### Requirement: Extended Dialog Sizes
Dialog 组件 MUST 支持更大的尺寸以容纳完整表格。

#### Scenario: 使用 xl 尺寸 Dialog
Given 开发者需要显示大型表格
When 使用 Dialog 组件并设置 size="xl"
Then Dialog 宽度 SHALL 为 max-w-5xl (1024px)
And 高度 SHALL 自适应内容

#### Scenario: 使用 full 尺寸 Dialog
Given 开发者需要最大化表格视图
When 使用 Dialog 组件并设置 size="full"
Then Dialog 宽度 SHALL 为 90vw
And 高度 SHALL 为 90vh
And 内容区域 SHALL 支持滚动

