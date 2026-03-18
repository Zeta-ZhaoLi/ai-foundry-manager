# Extract Editable Default Supported Model List

## Why

- The fresh-install default supported model list currently lives in `src/constants/defaultMasterModelDirectory.ts` as a large inline string.
- That makes routine manual edits inconvenient because maintainers have to modify application source instead of a simple dedicated data file.
- The user clarified that `Azure-AI-Founryd-Deployment-Template.json` must remain untouched and independent.

## What Changes

- Introduce one dedicated, manually editable file for this project's default supported model list.
- Use that file as the source for the fresh-install Global Model Directory seed instead of hard-coding the large list directly in a TypeScript constant.
- Keep `Azure-AI-Founryd-Deployment-Template.json` unchanged and out of scope.
- Add minimal validation/tests so the separate file continues to preserve the exact formatting required by the current parsing logic.

## User-Visible Impact

- Fresh installs will continue to receive the same default Global Model Directory behavior.
- Existing saved `ai-foundry-manager:master-models` data will continue to be preserved and will not be overwritten.
- Maintainers will be able to update the project's default supported model list in one simple file.

## Scope

- In scope:
  - a new standalone file for the default supported model list
  - loading that file as the source of the default Global Model Directory seed
  - tests/spec updates for formatting preservation and seeding behavior
- Out of scope:
  - changing `Azure-AI-Founryd-Deployment-Template.json`
  - synchronizing default models with template `modelDeployments`
  - changing Global Model Directory parsing or grouping rules
  - changing UI editing flows for models

## Risks and Mitigations

- Risk: moving the string into another file could accidentally alter commas, blank lines, or trailing newline behavior.
  - Mitigation: preserve the file contents verbatim and keep/update tests that assert formatting-sensitive behavior.
