# Tasks

## Phase 1: Line-Preserving Model Grouping

- [x] Extend master directory parsing to preserve per-line layout within each blank-line group
- [x] Update Region model picker to render models by input line (within group)
- [x] Update Global Summary to follow group boundaries and (recommended) render by line
- [x] Update Master Model Directory panel list to reflect line layout
- [x] Update i18n for any new UI labels (group/line)
- [x] Add/extend unit tests for line-preserving parsing

## Phase 2: Deployment Code Export (Replace Portal Flow)

- [x] Implement a generator that builds a full ARM template JSON from `mainTemplate.json`
- [x] Replace RegionCard Portal-based "一键部署" action with "Copy Deployment Code"
- [x] Validate required inputs and show actionable errors
- [x] Add unit tests for deployment code generation
- [x] Update i18n for deployment code copy labels/toasts

## Phase 3: Validation

- [x] Run `npm run test`
- [x] Run `npm run lint`
- [x] Run `npm run build`
