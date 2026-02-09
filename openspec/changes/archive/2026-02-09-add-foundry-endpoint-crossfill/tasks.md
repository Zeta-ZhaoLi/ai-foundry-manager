# Tasks

- [x] Extend region endpoint data model to include Foundry project endpoint and AI Services endpoint.
- [x] Implement endpoint parsing/conversion utilities for the 4-endpoint matrix using Azure public cloud patterns.
- [x] Implement endpoint normalization updates (trailing slash removal across supported endpoint inputs, plus Anthropic suffix normalization).
- [x] Update region endpoint UI to expose all endpoint fields and wire edit handlers so editing any one endpoint cross-fills the other three.
- [x] Reconcile existing endpoint auto-sync/override indicators and flags with the new "any one fills others" behavior.
- [x] Move/keep `Resource Name` in account info (immediately after quota) and ensure region deployment uses this account-level value.
- [x] Add/update tests for utility conversion rules, region UI autofill behavior, and account-level `Resource Name` placement.
- [x] Update spec deltas for endpoint conversion, normalization, and account-level deployment input placement.
- [x] Run validation (`openspec validate add-foundry-endpoint-crossfill --strict`) and relevant test suites during implementation.
