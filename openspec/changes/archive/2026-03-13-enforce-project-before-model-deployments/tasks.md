# Tasks

- [x] Update exported deployment template generation so model deployments depend on the Foundry project resource as well as the Azure AI account resource.
- [x] Update deployment export spec coverage to require project-before-model deployment sequencing.
- [x] Add or update template generation tests to assert the deployment wrapper dependency order.
- [x] Validate proposal artifacts with `openspec validate enforce-project-before-model-deployments --strict`.
