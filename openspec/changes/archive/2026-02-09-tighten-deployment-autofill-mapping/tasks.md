# Tasks

- [x] Refactor template deployment lookup utilities to support both `modelName -> entries[]` and `deploymentName -> entry` mappings.
- [x] Update deployment row initialization to use deterministic per-model template defaults while preserving saved row values.
- [x] Implement deploymentName edit-time sync: exact template match (same model) updates `version` and `capacity`.
- [x] Enforce model integrity constraints: row `modelName` immutable; `deploymentName` must include row `modelName`; reject cross-model template matches.
- [x] Update copy/export validation and user-facing errors for new integrity constraints.
- [x] Add/update unit and component tests covering multi-deployment-per-model mappings and anti-model-swap rules.
- [x] Update OpenSpec delta in `azure-deployment-code-export` for autofill and validation requirements.
- [x] Validate with `openspec validate tighten-deployment-autofill-mapping --strict`.
