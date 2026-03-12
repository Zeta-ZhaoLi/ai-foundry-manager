# Design: Generate Region Endpoints From Account Email

## Context

The region form currently supports two related but separate workflows:

1. Users manually type `Resource Name`.
2. Users manually type one endpoint and let the system convert it into the other endpoint variants.

The new request introduces a third entry path: generate a complete region identity bundle from the account name. This is not just another endpoint conversion because it starts from account metadata, creates new random suffixes, and must preserve manual edits unless the user explicitly confirms overwrite.

## Goals

- Let users generate `resourceName` and all four endpoint fields from the account email local-part with one explicit button click.
- Keep generation region-scoped so different regions under the same account receive different generated identities.
- Preserve manual edit freedom after generation.
- Prevent silent data loss when existing manual values are present.

## Non-Goals

- Automatic generation on account-name change
- Support for non-email account names
- Cloud validation of generated names against Azure availability

## Generation Model

Use the account email local-part as the base seed.

- Example input: `jessicabarrios060193@gmail.com`
- Base seed: `jessicabarrios060193`

Generate:

- `resourceName`: `<truncated-base>-<random-digits>-resource`
- Foundry project endpoint: `https://<resourceName>.services.ai.azure.com/api/projects/<projectId>`
- OpenAI endpoint: `https://<resourceName>.openai.azure.com`
- AI Services endpoint: `https://<resourceName>.cognitiveservices.azure.com`
- Anthropic endpoint: `https://<resourceName>.services.ai.azure.com/anthropic`
- `projectId`: `<base>-<random-digits>`

Constraints:

- `resourceName` must be unique among sibling regions in the same account.
- `resourceName` must be at most 32 characters.
- The numeric random segment length is implementation-defined; only the 32-character `resourceName` ceiling is contractual.
- `projectId` does not share the 32-character cap from this request.

## Overwrite Safety

The requested UX distinguishes manual values from generated values. Current region data does not track this provenance, so implementation needs an explicit way to know whether the current bundle was entered manually or created by the generator.

Expected behavior:

- Button click is the only trigger for account-email generation.
- Empty target fields may be filled immediately.
- If any target field contains manual content, the system must request confirmation before overwrite.
- After generation, users may still manually edit any generated field.

This implies implementation should record enough provenance to distinguish:

- untouched/empty
- generator-produced values
- manually edited values

The exact storage shape can be decided during implementation, but the behavior contract requires this distinction.

## Error Handling

- If `account.name` is not a valid email address, generation aborts.
- The UI shows an actionable error toast or equivalent inline feedback.
- No region fields change when generation is rejected.

## Affected Areas

- `RegionCard` UI layout and action handling
- Region/account state update flow
- Shared generation helper(s) in utilities
- Tests for generation, overwrite confirmation, and invalid account names
