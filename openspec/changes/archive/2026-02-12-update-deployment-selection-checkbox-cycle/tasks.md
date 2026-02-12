# Tasks

- [x] Update region deployment table header UI in `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` to use a single tri-state bulk checkbox and remove any deployment bulk-action text/button controls.
- [x] Implement tri-state bulk toggle cycle for deployment rows (`invert` -> `select all` -> `select none`) using deployment row `enabled` state.
- [x] Update locale strings for the deployment first-column label from include/join semantics to select semantics across supported locale files in `src/i18n/locales/*.json`.
- [x] Add/adjust tests in `src/components/Dashboard/AccountConfiguration/__tests__/deploymentConfig.test.tsx` to verify: label rename, tri-state cycle order, and row-state outcomes for all three actions.
- [x] Run `openspec validate update-deployment-selection-checkbox-cycle --strict` and resolve all validation findings.
