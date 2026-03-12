# Generate Region Endpoints From Account Email

## Why

- Region deployment currently requires users to manually fill `Resource Name` and, in many cases, multiple endpoint fields even when those values can be derived from a single naming seed.
- Users want a one-click way to generate a region-scoped Azure resource identity and all four related endpoint forms from the account name, without typing each field by hand.
- The requested generation must be explicit and safe: only email-style account names are valid seeds, generated `resourceName` values must stay within 32 characters, and existing manual values must not be overwritten silently.

## What Changes

- Add a region-level "Auto Generate" action next to the `Resource Name` input.
- When the user clicks the action, generate a region-specific `resourceName`, Foundry project endpoint, OpenAI endpoint, Azure AI Services endpoint, and Anthropic endpoint from the account email local-part.
- Require account names to be valid email addresses for generation; non-email account names must show an actionable error and leave all region values unchanged.
- Ensure each region under the same account receives a different generated `resourceName`.
- Limit generated `resourceName` to 32 characters while keeping the `-resource` suffix.
- Keep all generated fields manually editable after generation.
- Protect existing manual values: clicking the generate action when target fields contain manual values must require explicit confirmation before overwrite.

## Scope

- In scope:
  - Region configuration UI for `Resource Name` generation
  - Account-email-based identity generation rules
  - Region endpoint population from generated identity
  - Manual-vs-generated overwrite protection
  - Validation, confirmation, and test coverage updates
- Out of scope:
  - Automatic generation without a button click
  - Generation from non-email account names
  - Azure-side uniqueness checks against live cloud resources
  - Changing deployment export schema or endpoint normalization rules

## Current Behavior Notes

- [`src/components/Dashboard/AccountConfiguration/RegionCard.tsx`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/components/Dashboard/AccountConfiguration/RegionCard.tsx) currently renders a manually editable region `Resource Name` input, but no generation control beside it.
- [`src/components/Dashboard/AccountConfiguration/RegionCard.tsx`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/components/Dashboard/AccountConfiguration/RegionCard.tsx) can already derive the other endpoint forms when a user manually enters one supported endpoint.
- [`src/components/Dashboard/AccountConfiguration/AccountCard.tsx`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/src/components/Dashboard/AccountConfiguration/AccountCard.tsx) already captures `account.name`, which is the requested input seed for generation.
- [`openspec/specs/azure-deployment-code-export/spec.md`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/openspec/specs/azure-deployment-code-export/spec.md) currently requires a manually editable region `Resource Name` field, but does not define a generation action.
- [`openspec/specs/endpoint-auto-conversion/spec.md`](/mnt/c/Users/lizha/OneDrive/Develop/Projects/Zeta/ai-foundry-manager/openspec/specs/endpoint-auto-conversion/spec.md) currently covers endpoint conversion from existing endpoint inputs, not account-email-driven generation.

## Risks and Mitigations

- Risk: Users may accidentally overwrite carefully curated manual region values.
  - Mitigation: require explicit confirmation before overwrite when any target field is marked as manual.
- Risk: Email local-parts can be too long to fit `resourceName` constraints.
  - Mitigation: specify deterministic truncation so generated `resourceName` never exceeds 32 characters and still ends with `-resource`.
- Risk: Non-email account names could produce misleading or low-quality generated identifiers.
  - Mitigation: reject non-email account names with a clear error and make no data changes.
- Risk: Random generation could produce duplicate values for sibling regions under the same account.
  - Mitigation: require account-local uniqueness checks and retry generation before applying values.
