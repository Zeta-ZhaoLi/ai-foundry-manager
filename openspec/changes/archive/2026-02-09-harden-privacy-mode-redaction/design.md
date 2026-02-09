# Design: Consistent Sensitive Data Redaction in Privacy Mode

## Context

Privacy mode is already wired through major dashboard components, but masking rules are currently distributed and partially inconsistent. Newly added `Resource Name` input is an immediate gap, and other sensitive fields need explicit policy-level alignment.

## Goals

- Ensure privacy mode redacts all defined sensitive fields consistently.
- Prevent accidental leaks via copy/reveal controls during privacy mode.
- Keep implementation minimal and local to UI rendering/interaction behavior.

## Non-Goals

- Reworking persistence/encryption.
- Introducing role-based access controls.

## Redaction Matrix (Proposed)

- `account.name`, `account.note`, `account.accountId`: masked/alias display (existing behavior preserved and normalized).
- `account.deployment.resourceName`: masked (`***`) and non-editable in privacy mode.
- Region endpoints: masked host display (existing pattern), non-editable in privacy mode, copy actions hidden/disabled in privacy mode.
- `region.apiKey`: force-masked display (`***` style behavior), disable reveal toggle and copy in privacy mode.
- Financial values (purchase/used/cost totals): keep masked behavior in overview/summary tables.

## Interaction Rules

- Privacy mode ON:
  - Sensitive inputs render masked values.
  - Sensitive reveal/copy actions are hidden or disabled.
  - Writes to sensitive fields are disabled.
- Privacy mode OFF:
  - Existing editable/copy behavior remains unchanged.

## Affected Areas

- `AccountCard` sensitive account fields (`Resource Name` included).
- `RegionCard` API key/endpoints related controls.
- Summary/overview components already masking financial/sensitive labels (verify and align).

## Validation Strategy

- Add/update component tests for privacy mode redaction in account and region configuration.
- Verify no i18n key regressions.
- Run targeted tests for deployment/privacy-related components.
