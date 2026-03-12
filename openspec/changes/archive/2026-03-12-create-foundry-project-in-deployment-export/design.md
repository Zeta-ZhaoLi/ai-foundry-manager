# Design: Create Foundry Project In Deployment Export

## Context

The current deployment export path is centered on Azure AI account creation plus model deployments. That is enough to provision model endpoints, but not enough to provision the Foundry project referenced by `Foundry Project Endpoint`.

The requested behavior adds one missing resource and one missing identity rule:

1. The copied deployment template must create the project.
2. When a project endpoint is not explicitly configured, the export path must still be able to resolve a deterministic project identity from `Resource Name`.

## Goals

- Ensure copied deployment code provisions the Foundry project in the same exported template.
- Keep project identity deterministic and consistent across export logic and endpoint helpers.
- Preserve manual project endpoint overrides when they are valid.

## Non-Goals

- Adding new interactive generation controls in the region form
- Verifying project existence against Azure before copy
- Reworking region identity generation beyond the project-derivation rule needed here

## Effective Project Identity Resolution

Deployment export should resolve an effective Foundry project identity in this order:

1. If `Foundry Project Endpoint` is non-empty and valid, use its hostname/resource and path `projectId`.
2. If `Foundry Project Endpoint` is empty, derive it from `Resource Name`.
3. If `Foundry Project Endpoint` is non-empty but invalid, fail export with an actionable error.

Derived endpoint rule:

- Host resource name: the configured region `Resource Name`
- Default `projectId`:
  - if `resourceName` ends with `-resource`, strip that suffix;
  - otherwise use the full `resourceName`
- Derived endpoint:
  - `https://<resourceName>.services.ai.azure.com/api/projects/<projectId>`

This keeps the rule aligned with the user example:

- `resourceName = bakarahmed24-2561-resource`
- `projectId = bakarahmed24-2561`

## Template Update Strategy

Keep changes minimal by extending the existing canonical deployment template path instead of introducing a second export format.

Expected export result:

- Azure AI account resource remains present.
- Model deployment resources remain present.
- A Foundry project resource is added and depends on the account resource.

The exact ARM resource shape will be implemented against the project template contract already used by the repository's canonical template workflow.

## Validation Strategy

- Unit tests for project identity derivation from:
  - explicit valid Foundry endpoint
  - empty Foundry endpoint plus `resourceName`
  - `resourceName` with and without `-resource` suffix
- Template tests ensuring the exported JSON includes project creation.
- Region deployment tests ensuring copy/export is blocked for malformed non-empty Foundry project endpoints.
