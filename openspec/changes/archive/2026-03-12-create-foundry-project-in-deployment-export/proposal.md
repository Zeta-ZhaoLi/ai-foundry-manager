# Create Foundry Project In Deployment Export

## Why

- The copied deployment template currently creates the Azure AI account and model deployments, but it does not create the Foundry project itself.
- As a result, users can finish deployment and still end up with a missing project behind `Foundry Project Endpoint`, which breaks the intended post-deployment workflow.
- Users also want the deployment flow to work even when `Foundry Project Endpoint` has not been filled manually, by deriving a default project identity from `Resource Name`.

## What Changes

- Extend deployment code export so the generated ARM template creates the Foundry project in addition to the Azure AI account and model deployments.
- Define one effective project-identity resolution path for deployment export:
  - use the entered `Foundry Project Endpoint` when it is valid;
  - otherwise derive the endpoint from `Resource Name`.
- When deriving from `Resource Name`, generate `projectId` from the same name seed:
  - if `resourceName` ends with `-resource`, remove that suffix for `projectId`;
  - otherwise use the full `resourceName` as `projectId`.
- Keep the scope limited to deployment export and endpoint/project derivation rules needed by that export path.

## Scope

- In scope:
  - Deployment export template content
  - Deployment export validation and project-identity derivation
  - Consistent default `projectId` derivation for helper logic used by export
  - Test coverage for project creation and derived project identity
- Out of scope:
  - New region form buttons or fields
  - Azure-side existence checks against live subscriptions
  - Changing random generation rules for region identity bundles
  - Non-deployment automation beyond the derivation helpers already used by the app

## Current Behavior Notes

- `src/utils/armTemplate.ts` currently builds deployment templates that create `Microsoft.CognitiveServices/accounts` and `Microsoft.CognitiveServices/accounts/deployments`, but no Foundry project resource.
- `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` currently copies deployment code from `stringifyAzureOpenAiMainTemplate(...)` after validating `resourceName`, location, and deployment rows, but it does not require or synthesize a project resource.
- `openspec/specs/azure-deployment-code-export/spec.md` currently defines deployment export around account and model deployment creation only.
- `openspec/specs/endpoint-auto-conversion/spec.md` currently defines default `projectId` generation from resource identity, but its default rule does not yet reflect the requested `-resource` suffix stripping behavior.

## Risks and Mitigations

- Risk: Export logic and endpoint helpers could derive different `projectId` values for the same `resourceName`.
  - Mitigation: define one shared derivation rule in spec and apply it to both deployment export and helper behavior.
- Risk: A manually entered but malformed `Foundry Project Endpoint` could silently produce an unexpected project.
  - Mitigation: require export to reject non-empty invalid Foundry project endpoints instead of guessing.
- Risk: Updating the canonical template without matching generator tests could regress copied deployment code.
  - Mitigation: add focused tests for template content and export validation paths.
