# Design: Conservative Dead-Code Pruning + README Realignment

## Context

This change combines three related maintenance goals:

1. Remove code that is no longer used.
2. Reorganize `README.md` so documentation matches the real product state.
3. Synchronize localization quality across README variants and UI strings.

Because dead-code cleanup can accidentally remove latent dependencies, this design favors conservative, evidence-based deletion.

## Goals

- Eliminate code that is demonstrably unused in runtime, tests, and build paths.
- Keep functional behavior unchanged for active features.
- Produce a clearer, implementation-accurate `README.md`.
- Keep localized README files aligned with canonical README structure and intent.
- Ensure user-facing UI labels are locale-driven across all supported languages.

## Non-Goals

- Introducing new product features.
- Reworking architecture of active modules.

## Cleanup Strategy

### 1) Evidence Collection

- Use import/reference scans to identify candidate dead files and exports.
- Check app entry usage (`App.tsx`, dashboard composition, feature entry components).
- Check test usage and any build-only usage.

### 2) Conservative Removal Rules

A candidate can be removed only when all are true:

- No runtime import/reference in active app paths.
- No test import/reference.
- No config/build/tooling import/reference.
- No spec-mandated active behavior depends on it.

### 3) Verification Gate

After cleanup, run:

- `npm run lint`
- `npm run test`
- `npm run build`

If any failure appears, restore required code or adjust cleanup scope.

## README Reorganization Strategy

- Keep canonical README focused on: overview, key features, setup, usage basics, architecture/storage, development commands, and contribution/license metadata.
- Remove stale/legacy feature claims that do not exist in current UI behavior.
- Ensure commands and URLs are copy-paste-ready and verified against current scripts/project settings.

## Localization Synchronization Strategy

### README variants

- Treat `README.md` as canonical source.
- Update each localized README variant to mirror section hierarchy and core claims.
- Preserve language index links at top of every README variant.

### UI localization completeness

- Audit UI for hardcoded user-facing strings (especially deployment table labels/headers and action text).
- Replace hardcoded strings with i18n keys.
- Add missing keys to all supported locale files (`zh`, `en`, `ja`, `fr`, `de`, `es`, `pt-BR`, `ko`).
- Re-run locale completeness tests to ensure no locale keyset drift.

## Trade-offs

- Conservative deletion may leave small non-harmful leftovers, but reduces regression risk.
- Full multilingual README sync increases content-update effort but avoids long-term documentation divergence.
