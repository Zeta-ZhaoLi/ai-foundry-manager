# Enforce Project Before Model Deployments

## Why

- Users need the Foundry project to be deployed before any model deployment resources run.
- The current exported template already places the project resource ahead of the top-level deployment wrapper in the resource list, but the model deployment wrapper still only depends on the Azure AI account.
- Without an explicit dependency on the project resource, the actual deployment order is not guaranteed by the template contract.

## What Changes

- Require exported deployment code to enforce project-before-model ordering through template dependencies, not just resource array position.
- Update the model deployment wrapper resource so it depends on both:
  - the Azure AI account resource
  - the Foundry project resource
- Keep the existing account resource, project resource, and model deployment resource shapes otherwise unchanged.
- Add or update tests so the deployment wrapper dependency contract is locked down.

## Scope

- In scope:
  - Exported ARM template dependency ordering between project creation and model deployments
  - Deployment export spec language for project-before-model sequencing
  - Template generation tests for dependency order
- Out of scope:
  - Changes to project identity derivation
  - Changes to UI or validation flow
  - Changes to per-model payload fields

## Current Behavior Notes

- [`src/utils/armTemplate.ts`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/utils/armTemplate.ts) currently emits the project resource before the top-level model deployment wrapper in the resource array.
- [`src/utils/armTemplate.ts`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/utils/armTemplate.ts) currently gives the model deployment wrapper only one `dependsOn` entry for `Microsoft.CognitiveServices/accounts`, so project-first execution is not contractually enforced.
- [`openspec/specs/azure-deployment-code-export/spec.md`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/openspec/specs/azure-deployment-code-export/spec.md) currently requires project creation, but does not yet require model deployments to wait for project creation.

## Risks and Mitigations

- Risk: Treating array order as execution order would leave deployment sequencing nondeterministic.
  - Mitigation: specify explicit dependency requirements in the template and tests.
- Risk: A broader refactor of deployment resources would increase surface area for a small sequencing fix.
  - Mitigation: keep the change limited to dependency declarations and test assertions.
