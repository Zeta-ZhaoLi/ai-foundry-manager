# Harden Privacy Mode Redaction

## Why

- `Resource Name` is now account-level deployment metadata and currently remains visible when privacy mode is enabled.
- A broader audit shows privacy behavior is inconsistent across views: some sensitive fields are masked, while others remain readable or still allow copy/reveal actions.
- Users expect privacy mode to provide reliable screen-sharing safety for all sensitive information.

## What Changes

- Treat `Resource Name` as sensitive and mask it in privacy mode.
- Audit all user-visible sensitive fields and enforce consistent redaction behavior in privacy mode.
- Standardize privacy-mode behavior for sensitive copy/reveal actions (do not expose secrets through copy buttons or reveal toggles while privacy mode is enabled).
- Keep non-sensitive operational structure visible (layout, row counts, enable/disable states) so users can still navigate configuration safely.

## Sensitive Field Scope

This change proposal covers sensitive fields currently managed in account/region/dashboard views, including:

- Account identifiers and labels that can identify tenants/accounts (`accountId`, account name, account note).
- Deployment metadata (`resourceName`).
- Endpoints (Foundry/OpenAI/AI Services/Anthropic URLs).
- API keys and secret-like fields.
- Cost/financial values already handled in summary/overview tables (ensure consistent masking remains intact).

## Out of Scope

- Data encryption/storage format changes.
- Permission/auth changes.
- Backend service changes.

## Risks and Mitigations

- Risk: Over-masking can reduce usability during private local usage.
  - Mitigation: Apply masking only when privacy mode is enabled; keep existing behavior unchanged when privacy mode is off.
- Risk: Inconsistent handling across pages can regress over time.
  - Mitigation: Define a single privacy redaction matrix and add focused tests for key pages/components.
