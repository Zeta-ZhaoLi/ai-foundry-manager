# Design: Editable Default Supported Model List

## Context

The repository currently keeps the fresh-install default supported model list inside `src/constants/defaultMasterModelDirectory.ts` as one large inline string literal.

The user wants that default list extracted into a separate file so it is fast to edit manually, and explicitly does not want `Azure-AI-Founryd-Deployment-Template.json` involved in this change.

## Goals

- Give maintainers one obvious file to edit when adding, removing, or reordering the project's default supported models.
- Preserve authored ordering, commas, empty tokens, blank-line grouping, and trailing newline behavior for the default Global Model Directory seed.
- Keep the implementation minimal by changing only the source of the default list, not the surrounding behavior.

## Non-Goals

- Changing `Azure-AI-Founryd-Deployment-Template.json`
- Synchronizing with template `modelDeployments`
- Supporting multiple catalog variants or environment-specific model sets
- Reworking Global Model Directory parsing semantics

## Proposed Source Shape

Use one dedicated repository file containing the default model list in a format that is easy to edit manually and preserves exact authored text.

The simplest viable shape is a plain text file whose contents are the canonical default Global Model Directory text. That keeps editing friction low and avoids any transformation that could disturb formatting-sensitive details.

## Loading Strategy

Treat the separate file as the canonical source for the fresh-install default seed:

1. Move the canonical default list into the dedicated file.
2. Update the existing default-seed constant/module to read or re-export that file content.
3. Leave all current initialization and migration rules unchanged.

## Validation Strategy

- Keep or update the existing fresh-install seeding tests so they still verify exact default text usage.
- Add a focused check that the separate file content is consumed verbatim, including blank lines, `,,`, commas, and the trailing newline when present.
