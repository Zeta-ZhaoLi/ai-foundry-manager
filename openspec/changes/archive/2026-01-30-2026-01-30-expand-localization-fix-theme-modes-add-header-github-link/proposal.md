# Expand Localization, Fix Theme Modes, Add Header GitHub Link

## Why

- The UI currently only ships Chinese/English translations, but the project is useful for a broader audience.
- Theme switching advertises Dark/Light/System, but only the dark visual style is effectively applied today.
- The GitHub repository link exists in the footer; adding it to the header improves discoverability.

## What Changes

### 1) Add More UI Languages

- Expand supported UI languages beyond `zh` and `en` to include: `ja`, `fr`, `de`, and other common languages: `es`, `pt-BR`, `ko`.
- Replace the current zh/en toggle with a multi-language selector (still in the header) that:
  - supports selecting any supported language
  - persists to `ai-foundry-manager:lang`
  - falls back safely when an unknown language is stored

### 2) Update README and Provide Localized READMEs

- Keep `README.md` as the canonical README (English), updated to reflect current behavior and UI.
- Add localized READMEs aligned to the canonical content:
  - `README.zh-CN.md`
  - `README.ja.md`
  - `README.fr.md`
  - `README.de.md`
  - `README.es.md`
  - `README.pt-BR.md`
  - `README.ko.md`
- Add a language index block at the top of each README linking to the other language versions.

### 3) Fix Light and System Theme Modes

- Ensure Light mode is visually light (background, surfaces, text) rather than reusing the dark palette.
- Ensure System mode truly follows OS `prefers-color-scheme`, including live updates when the OS theme changes.
- Keep theme persistence on `ai-foundry-manager:theme` and preserve existing migration behavior.

### 4) Add GitHub Link in the Header (Top Right)

- Add a GitHub icon+link in the header control area (top-right).
- Keep the existing footer link unless it becomes redundant during implementation.

## Current State (Observed)

- i18n: `src/i18n/index.ts` only recognizes `zh` and `en`, and `src/App.tsx` only toggles between them.
- Theme: `src/contexts/ThemeContext.tsx` correctly resolves `system`, but Tailwind theme tokens and many UI classes are effectively dark-only, so Light/System do not visually change.
- GitHub link: present in the footer in `src/App.tsx`, not in the header.

## Files Affected (Expected)

- `src/i18n/index.ts` (register additional locales; expand language validation; fallback rules)
- `src/i18n/locales/ja.json` (new)
- `src/i18n/locales/fr.json` (new)
- `src/i18n/locales/de.json` (new)
- `src/i18n/locales/es.json` (new)
- `src/i18n/locales/pt-BR.json` (new)
- `src/i18n/locales/ko.json` (new)
- `src/App.tsx` (language selector UI; add header GitHub link; ensure UI colors are theme-aware)
- `src/contexts/ThemeContext.tsx` (minor adjustments if needed for reliable light/system behavior)
- `tailwind.config.js` and `src/index.css` (introduce a light palette and ensure semantic tokens render correctly)
- Various `src/components/**/*.tsx` (replace hard-coded dark colors with semantic tokens where required for true light mode)
- `README.md` (update + add language links)
- `README.zh-CN.md`, `README.ja.md`, `README.fr.md`, `README.de.md`, `README.es.md`, `README.pt-BR.md`, `README.ko.md` (new)

## Testing / Validation

- Manual:
  - Switch language among all supported options; reload; confirm persistence.
  - Switch theme among Dark/Light/System; confirm Light is visually light; confirm System follows OS and updates live.
  - Confirm header GitHub link is visible on desktop and mobile and opens a new tab.
- Automated:
  - Add a lightweight unit test to assert all locale JSON files contain the same translation key set.
  - Add a unit test to assert theme persistence and resolved-theme switching behavior.

## Risks / Considerations

- Translation quality: initial translations may be machine-generated; plan for iterative refinement.
- Theme refactor scope: converting hard-coded dark UI colors to tokens may touch many components; keep changes minimal and targeted to achieve a correct Light mode.
