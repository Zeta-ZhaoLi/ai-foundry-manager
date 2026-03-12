# Tasks

- [x] Update deployment export rules so copied ARM templates create the Foundry project resource together with the Azure AI account and model deployments.
- [x] Add effective project-identity resolution for deployment export: valid explicit Foundry project endpoint wins; otherwise derive from `Resource Name`.
- [x] Update default `projectId` derivation so `resourceName` values ending with `-resource` resolve to a suffix-stripped project identifier.
- [x] Block deployment export when `Foundry Project Endpoint` is non-empty but invalid, instead of silently guessing a project identity.
- [x] Add or update tests for exported template project creation, explicit-vs-derived project identity, suffix stripping, and invalid endpoint handling.
- [x] Validate proposal artifacts with `openspec validate create-foundry-project-in-deployment-export --strict`.
