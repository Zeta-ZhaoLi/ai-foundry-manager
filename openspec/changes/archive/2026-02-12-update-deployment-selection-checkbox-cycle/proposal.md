# Update Deployment Selection to Tri-State Checkbox Cycle

## Why

- In each region's model deployment table, the first column label currently reads `加入` / `Include`, which does not match the intended interaction language (`选择` / `Select`).
- Users need three bulk operations for deployment row enablement: select all, invert selection, and select none.
- The requested interaction must stay compact: one checkbox control cycling through three visual states, without extra bulk-action buttons or text labels.

## What Changes

- Rename the deployment table's first column label semantics from `Include` to `Select` (Chinese: `选择`).
- Add a single tri-state bulk checkbox in the deployment table header for each region.
- Define a deterministic click cycle that maps checkbox visual states to actions:
  - `indeterminate` state triggers **invert selection** across rows.
  - `checked` state triggers **select all** rows.
  - `unchecked` state triggers **select none**.
- Ensure the deployment table does not introduce additional bulk-action buttons/text for these three actions.
- Add/adjust tests for label text and tri-state cycle behavior.

## Scope

- In scope:
  - Region deployment table header label update (`加入` -> `选择`, `Include` -> `Select`).
  - Header-level tri-state checkbox behavior for deployment row `enabled` toggles.
  - Locale updates for affected deployment label(s).
  - UI test updates for deployment selection behavior.
- Out of scope:
  - Changing per-row checkbox behavior.
  - Changing model selection controls in the non-deployment section.
  - Introducing additional bulk-action buttons, menus, or hotkeys.

## Assumptions

- The tri-state interaction is implemented as a single header checkbox in the deployment table's first column.
- The action cycle order is fixed as: `invert` -> `select all` -> `select none` -> repeat.

## Risks and Mitigations

- Risk: Tri-state semantics may be non-obvious to first-time users.
  - Mitigation: Keep the visual state-to-action mapping deterministic and test-covered, and avoid conflicting bulk controls.
- Risk: Mixed initial row states could produce inconsistent results without clear rules.
  - Mitigation: Specify behavior against the pre-click snapshot for invert, and validate via interaction tests.
