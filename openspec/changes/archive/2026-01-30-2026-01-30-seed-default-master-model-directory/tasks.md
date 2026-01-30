# Tasks

- [x] Locate the Global Model Directory initialization code path and confirm current behavior on first run.
- [x] Introduce a single canonical default seed text constant/file and ensure it preserves exact formatting (blank lines + commas).
- [x] Update initialization logic:
  - migrate from `azure-openai-manager:master-models` when present
  - seed the default text only when the new key is missing (null), not when it is an empty string
- [x] Add tests covering:
  - fresh install (no new key, no legacy key) => default seed is used
  - existing value (including empty string) => value is preserved, not overwritten
  - legacy key present and new key missing => migration still works
- [x] Run `npm run test`, `npm run lint`, `npm run build`.
