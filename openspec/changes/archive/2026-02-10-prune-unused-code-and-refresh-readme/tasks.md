# Tasks

- [x] Inventory dead-code candidates across `src/` (files, exports, hooks/components, utils) using reference scans and confirm which candidates are truly unused.
- [x] Remove confirmed unused code with minimal edits, including stale imports/exports/types that become orphaned after deletion.
- [x] Verify no active behavior changed by running `npm run lint`, `npm run test`, and `npm run build`; resolve any regressions before proceeding.
- [x] Reorganize `README.md` to a cleaner structure and update content so features/architecture/commands match the current implementation.
- [x] Synchronize all localized README files with the canonical README structure and updated feature/architecture statements.
- [x] Audit UI for hardcoded or missing translations (including deployment table columns/actions such as `deploymentName`, `version`, `capacity`) and convert to i18n keys.
- [x] Add missing locale entries across all supported language files and verify locale keyset completeness tests pass.
- [x] Update `readme-documentation` spec delta so documentation requirements align with the refreshed README goals.
- [x] Update `i18n-language-expansion` spec delta so user-facing labels in core workflows are required to be locale-driven.
- [x] Add and validate `codebase-dead-code-cleanup` spec delta for conservative dead-code removal expectations.
- [x] Run `openspec validate prune-unused-code-and-refresh-readme --strict` and fix all issues.
