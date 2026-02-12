# Design: Tri-State Deployment Bulk Selection Checkbox

## Context

The region deployment table currently exposes row-level checkboxes for deployment inclusion and labels the first column as `加入` / `Include`. The requested UX requires:

1. Wording update to `选择` / `Select`.
2. A single compact control that provides three bulk actions: select all, invert, and select none.
3. No extra bulk-action buttons/text in the deployment section.

## Goals

- Keep the deployment table compact by using one header checkbox for all bulk actions.
- Provide deterministic, repeatable cycling behavior for the three actions.
- Preserve existing row-level include/exclude editing and deployment export semantics.

## Non-Goals

- Reworking deployment export validation rules.
- Changing non-deployment model picker controls.
- Adding explanatory helper text or additional action buttons.

## Proposed Interaction Contract

- The first deployment table column header displays localized `Select` text.
- A header checkbox cycles visual/action state on click:
  1. `indeterminate` -> apply **invert selection**.
  2. `checked` -> apply **select all**.
  3. `unchecked` -> apply **select none**.
  4. Repeat from step 1.
- Invert uses the row `enabled` values as they were immediately before the click.

## State Model

- Continue using `region.deployment.models[model].enabled` as the source of truth.
- Track a small UI-only cycle state for the header control so action order is deterministic regardless of current row distribution.
- Apply bulk updates by patching each deployment row through existing region deployment update pathways.

## Validation Strategy

- Component-level tests should verify:
  - Header label renders as localized `Select`.
  - Three consecutive clicks produce row states equivalent to invert, select all, and select none.
  - No alternate deployment bulk-action buttons are required for the three actions.
