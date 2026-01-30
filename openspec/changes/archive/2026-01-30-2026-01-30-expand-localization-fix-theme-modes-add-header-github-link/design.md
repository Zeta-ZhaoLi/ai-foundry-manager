# Design Notes

## Localization (UI)

### Supported languages

- `zh` (existing)
- `en` (existing)
- `ja` (new)
- `fr` (new)
- `de` (new)
- `es` (new)
- `pt-BR` (new)
- `ko` (new)

The implementation should keep the language list centralized (single source of truth) so adding more common languages later is a low-effort change.

### Language selection UI

Current state is a binary toggle. With 5+ languages, a selector is needed.

Preferred minimal approach:

- Use a small, styled native `<select>` in the header (accessible, mobile-friendly) with options for each supported language.
- Keep the existing pill-style controls and iconography.

### Translation completeness

- `zh.json` and `en.json` already contain the full keyset.
- Add a test that compares key paths across locales and fails if any locale is missing keys.
- Allow extra keys in a locale only if the canonical keyset is updated accordingly.

## Theme Modes

### Problem

Theme resolution logic exists (`dark` / `light` / `system`), but Tailwind theme tokens and many UI classes are effectively dark-only, so Light/System do not visually change.

### Minimal strategy

1. Introduce semantic color tokens that can represent both light and dark palettes.
2. Ensure the root element receives either `dark` or `light` class (resolved theme) so:
   - Tailwind `dark:` variants behave as expected
   - explicit light styling can be applied when needed

### Token approach

Keep Tailwind semantics (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, etc.) and make them map to different values under `.light` and `.dark`.

This requires:

- moving theme color definitions out of fixed hex values in `tailwind.config.js`
- defining the palette in CSS (e.g., in `src/index.css`) for both `.light` and `.dark`

Then, make only the necessary component edits to remove hard-coded dark-only Tailwind classes that block Light mode.

## Header GitHub Link

- Add a GitHub icon+link adjacent to other header controls.
- Ensure it is keyboard-focusable and has a localized `aria-label`.
- Keep the existing footer link unless the UI becomes cluttered.
