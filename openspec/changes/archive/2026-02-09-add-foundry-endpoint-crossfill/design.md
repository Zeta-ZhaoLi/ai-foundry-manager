# Design: Four-Endpoint Cross-Fill for Azure AI Foundry

## Context

The current endpoint utility and UI logic are centered on OpenAI <-> Anthropic conversion. The requested behavior introduces two additional endpoint types and requires "input any one, auto-fill all others." This changes both data model and sync semantics.

## Goals

- Support four endpoint forms in region config.
- Normalize endpoint values before parsing/conversion (trim trailing slash; keep Anthropic suffix normalization).
- Derive all endpoint forms from any one valid source endpoint.
- Keep implementation minimal and deterministic.

## Non-Goals

- Multi-cloud domain support beyond public Azure hostnames in examples.
- Runtime endpoint validation against Azure services.

## Proposed Model

Use a canonical parsed identity:

- `resource` (required for all conversions)
- `projectId` (optional; only present in Foundry project endpoint source)

Then generate endpoint outputs:

- Foundry project: `https://{resource}.services.ai.azure.com/api/projects/{projectIdOrDefault}`
- OpenAI: `https://{resource}.openai.azure.com`
- AI Services: `https://{resource}.cognitiveservices.azure.com`
- Anthropic: `https://{resource}.services.ai.azure.com/anthropic`

Default rule:

- `projectIdOrDefault = parsed.projectId ?? resource`

## Sync Semantics

- On any endpoint field edit:
  1. Normalize input value.
  2. Attempt to parse canonical identity.
  3. If parse succeeds, regenerate and write all four endpoint fields.
  4. If parse fails, keep user-entered value in edited field and do not overwrite others.

This keeps behavior aligned with "fill any one" while avoiding destructive writes on invalid input.

## Data & UI Impact

- Region data model adds fields for:
  - Foundry project endpoint
  - AI Services endpoint
- Region UI exposes four endpoint inputs with copy actions.
- Existing endpoint sync/override indicators are updated or removed to avoid conflicts with deterministic cross-fill.
- `Resource Name` remains account-scoped and is rendered in the account info block directly after quota, so deployment inputs are centralized at account level.

## Validation & Tests

- Utility tests for parse + generation from each source endpoint type.
- Tests for trailing slash normalization.
- Component tests confirming editing any one endpoint auto-fills the other three.
