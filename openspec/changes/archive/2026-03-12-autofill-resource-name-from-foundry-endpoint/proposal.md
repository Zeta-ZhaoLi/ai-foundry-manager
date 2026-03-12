# Autofill Resource Name From Foundry Endpoint

## Why

- Region deployment already depends on `region.deployment.resourceName`, but users must currently enter it separately even when the same Azure resource is already encoded in `Foundry Project Endpoint`.
- The region form already derives and cross-fills other endpoint variants from `Foundry Project Endpoint`, so leaving `Resource Name` empty creates avoidable duplicate input and copy/export validation failures.
- Users explicitly want `Foundry Project Endpoint` such as `https://pedrolaureanoferreira68-resource.services.ai.azure.com/api/projects/pedrolaureanoferreira68-6863` to auto-fill `Resource Name` as `pedrolaureanoferreira68-resource`.

## What Changes

- Auto-fill region deployment `Resource Name` from the hostname portion of a valid `Foundry Project Endpoint`.
- Derive `Resource Name` from the Azure resource host segment, not from the project path segment.
- Keep the region `Resource Name` input manually editable after auto-fill.
- Leave the existing `Resource Name` value unchanged when the Foundry endpoint input is empty, malformed, or not a supported Azure Foundry endpoint.
- Add or update tests covering host-based extraction, differing `projectId` values, and invalid-input behavior.

## Scope

- In scope:
  - Region form behavior when editing `Foundry Project Endpoint`
  - Reuse of existing Azure endpoint parsing helpers where possible
  - Spec updates for endpoint-derived `Resource Name` behavior
  - UI and test coverage updates
- Out of scope:
  - Auto-filling `Resource Name` from OpenAI, AI Services, or Anthropic endpoints
  - Introducing manual override flags or new sync-state UI
  - Changing deployment export schema or privacy-mode masking rules

## Current Behavior Notes

- [`src/components/Dashboard/AccountConfiguration/RegionCard.tsx`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/components/Dashboard/AccountConfiguration/RegionCard.tsx) currently cross-fills endpoint fields from a valid Foundry endpoint, but does not update `region.deployment.resourceName`.
- [`src/utils/common.ts`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/utils/common.ts) already parses Azure resource identity and can extract `resourceName` from supported endpoint formats.
- [`src/components/Dashboard/AccountConfiguration/RegionCard.tsx`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/components/Dashboard/AccountConfiguration/RegionCard.tsx) renders `Resource Name` as a separate region-level input after `API Key`.
- [`openspec/specs/endpoint-auto-conversion/spec.md`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/openspec/specs/endpoint-auto-conversion/spec.md) currently defines endpoint cross-fill and resource extraction, but not population of the deployment `Resource Name` field.

## Risks and Mitigations

- Risk: A malformed or non-Azure endpoint could accidentally wipe a valid `Resource Name`.
  - Mitigation: only auto-fill on valid supported Foundry project endpoints; otherwise preserve the existing field value.
- Risk: Users may still need to adjust `Resource Name` manually in edge cases.
  - Mitigation: keep the field editable and document that auto-fill is only an initial convenience, not a lock.
