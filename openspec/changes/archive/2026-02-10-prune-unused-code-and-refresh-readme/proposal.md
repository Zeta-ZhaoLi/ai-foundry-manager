# Prune Unused Code and Refresh README

## Why

- The user requested a full-project cleanup of unused code, a reorganized `README.md`, synchronized localized READMEs, and UI i18n completion (including deployment table headers like `deploymentName`, `version`, and `capacity`).
- A quick repository scan shows likely dead modules that are currently not imported by runtime/UI flows (for example `useAuditLog`, `useConfigHistory` + `components/ConfigHistory`, `useAzureChannels` + `api/newApiClient`, and `utils/connectivity`).
- `README.md` currently contains content drift versus current implementation (for example legacy server management sections) and needs restructuring to match the actual product scope.

## What Changes

- Perform a repository-wide dead-code audit focused on source files, exports, and hooks/components not referenced by app entrypoints, feature flows, tests, or build-time usage.
- Remove confirmed unused code and any associated stale types/exports while preserving active functionality.
- Keep cleanup conservative: only remove code proven unused by static references plus validation (`lint`, `test`, `build`).
- Reorganize `README.md` into a clearer structure that reflects current shipped capabilities and current architecture.
- Update README feature lists and examples to match real behavior after cleanup.
- Synchronize all localized README variants with the refreshed canonical README structure and content intent.
- Audit user-facing UI text for hardcoded/missing translations across supported languages and fill missing locale keys/usages.

## Scope

- In scope:
  - Unused source code cleanup under `src/` (modules, exports, dead utilities/hooks/components, and related references).
  - README restructuring and content refresh in `README.md`.
  - Localized README synchronization for `README.zh-CN.md`, `README.ja.md`, `README.fr.md`, `README.de.md`, `README.es.md`, `README.pt-BR.md`, and `README.ko.md`.
  - UI localization completeness audit and fixes for all supported locales (`zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`) including deployment table labels/columns.
  - Spec updates for cleanup expectations, README accuracy, and UI localization completeness.
- Out of scope:
  - New features or UI redesign.
  - Large refactors of active code paths beyond cleanup needs.

## Current Behavior Notes

- `README.md` still documents server-management capability sections that are no longer reflected in active UI logic.
- Localized README files may lag behind canonical README updates and need synchronized restructuring.
- Some user-facing UI labels in deployment-related tables are currently hardcoded English terms rather than locale-driven strings.
- Multiple modules appear unreferenced by current UI/app composition based on symbol/import search; final removal set must be confirmed by implementation-time checks.
- Existing `readme-documentation` spec includes rigid formatting constraints (for example fixed line-count range) that can conflict with concise reorganization goals.

## Risks and Mitigations

- Risk: Removing code that is indirectly used can break runtime behavior.
  - Mitigation: remove only code with verified no-reference status and run `npm run lint`, `npm run test`, and `npm run build` after cleanup.
- Risk: README rewrite drifts from implemented behavior again.
  - Mitigation: tie README sections directly to current feature set and update spec requirements to emphasize implementation alignment.
- Risk: Localized README files and UI locales become inconsistent across languages.
  - Mitigation: define a localization completeness pass (key audit + locale updates) and validate locale key coverage via existing i18n tests plus targeted UI checks.
