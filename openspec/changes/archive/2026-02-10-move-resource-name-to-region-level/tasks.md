# Tasks

- [x] Update account/region deployment data contracts in `useLocalAzureAccounts` so `resourceName` is stored under `region.deployment` and no longer maintained at account scope.
- [x] Add migration logic for legacy saved configs: fan out account-level `deployment.resourceName` to each existing region only when region-level value is missing.
- [x] Move `Resource Name` input from `AccountCard` to `RegionCard`, place it immediately after `API Key`, and keep it as manual user input.
- [x] Update deployment export path in `RegionCard` to read region-level `resourceName` and preserve existing validation/error behavior for missing values.
- [x] Update privacy mode behavior so region-level `Resource Name` is masked and non-editable when privacy mode is enabled.
- [x] Update/extend tests in account configuration and persistence hooks for field placement, migration, export mapping, and privacy masking.
- [x] Validate proposal artifacts with `openspec validate move-resource-name-to-region-level --strict`.
