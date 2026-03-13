# Complete Foundry Project Resource Metadata

## Why

- The exported deployment template now creates a Foundry project resource, but that resource is still incomplete compared with the expected ARM shape.
- In the current output, the project resource is missing `location`.
- The current `properties` block is empty, so the copied deployment code does not carry the expected `displayName` and `description` metadata for the project.
- This leaves the generated deployment code inconsistent with the desired project contract and can cause project creation behavior to diverge from the user's expected template.

## What Changes

- Update the exported Foundry project resource so it includes `location: [parameters('location')]`.
- Update the exported Foundry project resource so it includes `identity.type: SystemAssigned`.
- Update the exported Foundry project resource `properties` block to include:
  - `displayName: [parameters('projectName')]`
  - `description: AI project`
- Keep the current resource type, API version, name expression, and dependency on the parent account unchanged.
- Add or update tests so template generation explicitly verifies the completed project resource shape.

## Scope

- In scope:
  - Deployment template generation for `Microsoft.CognitiveServices/accounts/projects`
  - Deployment export spec language for required project resource metadata
  - Unit tests covering the project resource shape
- Out of scope:
  - Changes to project identity derivation
  - UI or validation flow changes
  - Changes to model deployment resources

## Current Behavior Notes

- [`src/utils/armTemplate.ts`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/utils/armTemplate.ts) currently generates the Foundry project resource with the right type and dependency, but without the full metadata contract for `location`, `identity`, `displayName`, and `description`.
- [`src/utils/__tests__/armTemplate.test.ts`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/utils/__tests__/armTemplate.test.ts) currently checks that a project resource exists, but it does not yet lock down the missing metadata fields.
- [`openspec/specs/azure-deployment-code-export/spec.md`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/openspec/specs/azure-deployment-code-export/spec.md) requires project creation, but does not yet state the full metadata contract for that resource.

## Risks and Mitigations

- Risk: The code could keep creating a project resource that exists structurally but is still missing required metadata.
  - Mitigation: add exact template assertions for `location`, `identity`, `displayName`, and `description`.
- Risk: A broader template refactor would increase review surface for a very small contract fix.
  - Mitigation: keep the change narrowly scoped to the project resource builder and related tests/spec text.
