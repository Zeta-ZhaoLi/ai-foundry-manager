# Design

## Goals

- Remove all server login parameter handling (UI + persistence) because the parameter set is deprecated.
- Define model grouping based on the user-authored text in the Global Model Directory.
- Preserve manual ordering from the Global Model Directory across default model lists.

## Master Directory Grouping Model

### Input

The Global Model Directory is a free-text field.

- Token separators inside a group: comma, spaces, tabs, and newlines.
- Group separators: one or more **blank lines** (a line that becomes empty after `trim()`).

### Output

Represent the directory as:

- `groups: string[][]` ordered by appearance
- `allModels: string[]` as a flattened list of unique model IDs ordered by first appearance across the entire directory

### Parsing Rules

1. Split the directory text into blocks separated by blank lines.
   - Implementation sketch: split on `/\r?\n\s*\r?\n+/` after normalizing newlines.
2. For each block, extract model tokens left-to-right.
   - Implementation sketch: match `/[^\s,]+/g` over the block.
3. De-duplicate across the entire directory by first appearance.
   - If a model appears multiple times (same token), only the first occurrence contributes to output.
   - Rationale: rendering a model multiple times creates confusing selection state.
4. Empty groups (blocks without tokens) are ignored.

### Group Labels (UI)

Blank-line blocks do not carry explicit names.

- Default: render an ordinal label (e.g., "Group 1", "Group 2") and a model count.
- Optional future extension (not part of this change): allow a comment/title syntax in the master directory.

## Ordering Semantics

### Canonical Order

The canonical order for master models is the flattened `allModels` order.

### Sorting Other Model Lists

When presenting a model list that is derived from the master directory (and has no explicit user-chosen sort), order models by:

1. master index (if the model exists in the directory)
2. then models not in the directory appended after (stable, keep their local order if available; otherwise fall back to lexical)

This allows:

- stable presentation across sessions
- predictable copy/export ordering

## Removing Server Login Parameters

### UX

- Remove the "Server Login Information" section from account cards.
- Remove server badges derived from server fields.

### Persistence and Compatibility

- Stop persisting `windowsServer` and `linuxServer` as part of the account schema.
- On load/import, strip these fields if present so legacy configs still import cleanly.
- Do not export these fields.

### Security Considerations

- Eliminates storage of additional sensitive fields (password/SSH key) beyond what remains necessary (API keys).
- Ensures encryption/decryption logic is not applied to deprecated fields.
