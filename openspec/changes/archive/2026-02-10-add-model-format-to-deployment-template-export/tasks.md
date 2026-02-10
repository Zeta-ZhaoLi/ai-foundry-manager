# Tasks

- [x] Extend deployment template types/lookups in `src/utils/armTemplate.ts` to parse and expose `modelFormat` defaults alongside existing model deployment defaults.
- [x] Extend region deployment model config/state (`RegionDeploymentModelConfig`) to store editable `modelFormat` and preserve backward compatibility for legacy saved data.
- [x] Update region deployment row initialization and edit handlers in `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` to auto-fill and persist `modelFormat`.
- [x] Add a new deployment table column for `modelFormat` immediately after `version`, with editable input behavior consistent with other row fields.
- [x] Update deployment export assembly and validation so enabled rows require valid `modelFormat` and copied JSON includes row `modelFormat`.
- [x] Add/update tests in `src/utils/__tests__/armTemplate.test.ts` and `src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx` for defaults, editability, validation, and exported JSON shape.
- [x] Run `openspec validate add-model-format-to-deployment-template-export --strict`, then run relevant test/lint commands (`npm run test`, `npm run lint`).
