# Add Foundry Endpoint Cross-Fill

## Why

- Region configuration currently supports bidirectional conversion only between OpenAI and Anthropic endpoints.
- Azure AI Foundry scenarios now require users to work with four endpoint forms: Foundry project endpoint, Azure OpenAI endpoint, Azure AI Services endpoint, and Anthropic endpoint.
- Users want to input any one endpoint and have the remaining endpoint fields auto-completed, while normalizing trailing slashes.

## What Changes

- Expand endpoint conversion from a 2-endpoint pair to a 4-endpoint conversion matrix.
- Add support for Foundry project endpoint and Azure AI Services endpoint in region configuration.
- Define deterministic conversion rules so entering any supported endpoint populates all other endpoint fields.
- Normalize input endpoints by removing trailing slashes before conversion.
- Keep `Resource Name` as an account-level field (not region-level), and place it inline in account info immediately after quota.
- Keep conversion scoped to Azure public cloud host patterns shown in the request examples.

## Conversion Scope

- Supported endpoint families:
  - Microsoft Foundry project endpoint: `https://{resource}.services.ai.azure.com/api/projects/{projectId}`
  - Azure OpenAI endpoint: `https://{resource}.openai.azure.com`
  - Azure AI Services endpoint: `https://{resource}.cognitiveservices.azure.com`
  - Anthropic endpoint: `https://{resource}.services.ai.azure.com/anthropic`
- Proposed default derivation for missing `projectId` when source endpoint does not include it:
  - `projectId = resource` (matches user-provided example pattern)

## Out of Scope

- Sovereign cloud domains (for example `.azure.us`, `.azure.cn`) in this change.
- Endpoint health checks or live connectivity validation.
- Backend/API integration changes.

## Risks and Mitigations

- Risk: In some tenants, Foundry `projectId` may differ from resource name.
  - Mitigation: Use deterministic default (`projectId = resource`) and allow manual editing of Foundry project endpoint after auto-fill.
- Risk: Existing OpenAI/Anthropic manual-override behavior conflicts with "fill any one" expectation.
  - Mitigation: Update endpoint conversion behavior to prioritize current edited field as source-of-truth and regenerate the other endpoint fields.
