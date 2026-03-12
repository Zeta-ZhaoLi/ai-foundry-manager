# Tasks

- [x] Update region Foundry endpoint change handling so a valid `Foundry Project Endpoint` also populates `region.deployment.resourceName` from the Azure resource host segment.
- [x] Preserve manual edit capability for `Resource Name` and ensure invalid or unsupported Foundry endpoint input does not clear an existing value.
- [x] Add or extend tests for RegionCard and endpoint parsing helpers, including cases where `projectId` differs from `resourceName`.
- [x] Validate proposal artifacts with `openspec validate autofill-resource-name-from-foundry-endpoint --strict`.
