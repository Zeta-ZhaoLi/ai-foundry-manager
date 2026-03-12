# Tasks

- [x] Add generation rules for deriving a region identity bundle from an email-style account name, including account-local uniqueness and `resourceName <= 32`.
- [x] Update the region deployment UI to show an auto-generate action beside `Resource Name` and populate `Resource Name` plus all four endpoint fields on click.
- [x] Add overwrite protection so existing manual values require explicit confirmation before generated values replace them.
- [x] Reject non-email account names with an actionable error and leave the region unchanged.
- [x] Add or update tests for generation patterns, truncation, uniqueness behavior, invalid account names, and overwrite confirmation.
- [x] Validate proposal artifacts with `openspec validate generate-region-endpoints-from-account-email --strict`.
