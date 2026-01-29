# Design

## Model Directory Parsing with Lines

### Current state

The master directory is parsed into groups separated by blank lines, and within a group all whitespace is treated as a separator. This loses the author's per-line formatting.

### Desired representation

Keep existing outputs (flattened unique list and group-level list), and add a line-level view for rendering.

Proposed parse result shape (conceptual):

- `groups`: ordered groups (each group is an ordered list of models)
- `groupLines`: ordered groups -> ordered lines -> ordered models
- `allModels`: flattened unique list ordered by first appearance

### Parsing rules

1. Split text into group blocks by one-or-more blank lines.
2. For each block, split by newline into lines.
3. For each non-empty line, tokenize by commas/spaces/tabs.
4. Global de-duplication by first appearance across the entire directory.
5. Empty lines are ignored for line output (except as group separators).

### Rendering rules

- Region model picker renders groups as sections; within each group, render each directory line as a row.
- Global summary renders groups as sections; inside each group, optionally render line rows (recommended) or a flattened list.

## Deployment Code Export

### Scope

The existing deployment UX lives in the Region deployment panel. This change replaces the Portal-based action with a one-click copy of the complete ARM template JSON for that region.

### Output format

The copied content is a single, complete ARM template JSON produced by using `mainTemplate.json` as the base and applying these substitutions:

- `parameters.resourceName.defaultValue`
- `parameters.location.defaultValue`
- `variables.modelDeployments`

### Template handling

`mainTemplate.json` is treated as the canonical template source (read-only). The generator should:

1. Load and parse the JSON
2. Replace only the fields listed above
3. Preserve the rest of the template structure and resource definitions

### Validation

The generator should fail with clear, actionable messages when:

- Region lacks determinable `resourceName` or `location`
- Any selected model lacks `version` or has invalid `capacity`

### Extensibility

If needed later, support generating a CLI wrapper (bash/pwsh) around the produced template JSON, but this is out of scope for this change.
