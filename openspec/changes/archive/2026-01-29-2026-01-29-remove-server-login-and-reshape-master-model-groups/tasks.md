# Tasks

## Phase 1: Remove Server Login Parameters

- [x] Remove server login UI from `src/components/Dashboard/AccountConfiguration/AccountCard.tsx`
- [x] Remove server badge display if it depends on deprecated server fields
- [x] Remove server credential storage/encryption/decryption from `src/hooks/useLocalAzureAccounts.ts`
- [x] Ensure config import ignores legacy `windowsServer` / `linuxServer` fields
- [x] Ensure config export does not include server login fields
- [x] Update i18n to retire server login strings

## Phase 2: Implement Grouped Master Directory Parsing (Blank-Line Blocks)

- [x] Add a parser for the Global Model Directory that returns ordered groups + flattened ordered list
- [x] De-duplicate models by first appearance while preserving order
- [x] Add tests for parsing (blank lines, commas/spaces, multiple blank lines, duplicates)

## Phase 3: Replace Fixed (standard/Sora/Claude) Categorization

- [x] Remove `ModelCategory` and 3-category grouping helpers from `src/utils/modelSeries.ts`
- [x] Update `src/components/Dashboard/AccountConfiguration/RegionCard.tsx` to use directory-defined groups
- [x] Update `src/components/Dashboard/Summary/GlobalSummary.tsx` to use directory-defined groups
- [x] Update `src/components/Dashboard/MasterModelDirectory.tsx` to render grouped model chips
- [x] Retire `modelCategory.*` translations and any category-specific UI labels/actions

## Phase 4: Ordering Behavior

- [x] Ensure master model ordering follows the directory (no `.sort()` on master models)
- [x] Ensure region selection lists and copy/export strings follow master ordering by default
- [x] Define behavior for models not present in the master directory (append after master-ordered models)

## Phase 5: Validation

- [x] Run `npm run test`
- [x] Run `npm run lint`
- [x] Run `npm run build`
