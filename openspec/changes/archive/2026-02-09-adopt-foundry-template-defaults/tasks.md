# Tasks

- [x] Update deployment template utilities to use `Azure-AI-Founryd-Deployment-Template.json` as the canonical import and keep deep-clone substitution behavior.
- [x] Implement template model-default lookup (`modelName` -> `deploymentName`, `version`, and `capacity`) with defensive parsing for malformed entries.
- [x] Apply template-derived defaults when initializing region deployment rows, while preserving saved row values and manual edit behavior.
- [x] Update deployment configuration fields: remove `Subscription ID`, replace `Resource Group` with `Resource Name` (`resourceName`), remove row-level `resourceName (AOAI 资源名称)`, and bind `location` to region code.
- [x] Add or update tests for template-source-based deployment export, default resolution from template model entries, deployment field contract changes/location-from-region behavior, and fallback behavior for unmatched/invalid template defaults.
- [x] Update OpenSpec delta for `azure-deployment-code-export` requirements to reflect the new canonical template, model default sourcing, and deployment field changes.
- [x] Run validation commands (`openspec validate adopt-foundry-template-defaults --strict`, `npm run test`, and `npm run lint`).
