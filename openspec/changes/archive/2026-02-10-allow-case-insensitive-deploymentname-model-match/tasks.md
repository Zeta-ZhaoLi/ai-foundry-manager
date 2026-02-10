# Tasks

- [x] Update region deployment validation in `RegionCard` to use case-insensitive matching for `deploymentName` contains `modelName`.
- [x] Update template-pair validation path so template `(deploymentName, modelName)` matches are evaluated case-insensitively and accepted.
- [x] Preserve and verify mismatch blocking when template `deploymentName` maps to a different model identity.
- [x] Add/adjust tests in `src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx` for case-insensitive pass and mismatch block.
- [x] Update `azure-deployment-code-export` spec delta to define case-insensitive include behavior and template-combination allowance.
- [x] Run `npm run test -- src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx`.
- [x] Run `openspec validate allow-case-insensitive-deploymentname-model-match --strict`.
