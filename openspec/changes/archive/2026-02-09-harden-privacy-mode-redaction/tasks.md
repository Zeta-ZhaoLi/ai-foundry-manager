# Tasks

- [x] Create a privacy redaction inventory for account/region/dashboard sensitive fields, including `Resource Name`.
- [x] Update account configuration UI so `Resource Name` is masked and non-editable in privacy mode.
- [x] Update region configuration UI so API key and endpoint sensitive actions (reveal/copy/edit) are safe under privacy mode.
- [x] Verify and align summary/overview masking behavior for sensitive numeric/account-identifying data.
- [x] Add/update tests covering privacy mode redaction behavior for account and region sensitive fields.
- [x] Update OpenSpec privacy-mode spec deltas to codify sensitive-field masking and interaction restrictions.
- [x] Validate with `openspec validate harden-privacy-mode-redaction --strict`.
