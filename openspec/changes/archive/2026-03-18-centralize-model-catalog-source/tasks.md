# Tasks

1. [x] Extract the default supported model list from `src/constants/defaultMasterModelDirectory.ts` into one dedicated, manually editable file.
2. [x] Update the default-seed loading path so fresh-install initialization uses that separate file without changing current localStorage migration/overwrite behavior.
3. [x] Preserve exact formatting semantics for the default list, including blank lines, commas, empty tokens, and trailing newline behavior.
4. [x] Add or update tests to verify the separate file is consumed verbatim by the default master-directory seed path.
5. [x] Update any developer-facing note that explains where to manually maintain the project's default supported model list.
6. [x] Run `openspec validate centralize-model-catalog-source --strict`, `npm run test`, and `npm run lint`.
   Note: `openspec validate` passed, `npm run lint` passed with existing warnings, and `npm run test` still has 2 pre-existing unrelated failures in `src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx` that expect capacity `1000` while the current `Azure-AI-Founryd-Deployment-Template.json` entries for `gpt-5.1` and `gpt-5.2` use capacity `10000`. The targeted test `npx vitest run src/utils/__tests__/masterModelsStorage.test.ts` passed.
