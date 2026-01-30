# Tasks

- [x] Inspect `src/components/Dashboard/MasterModelDirectory.tsx` to identify the model item element and existing color classes.
- [x] Define a small, reusable heatmap helper (bucket + Tailwind class mapping) that only affects color-related classes.
- [x] Update the Global Model Directory parsed list rendering to:
  - compute `maxCount` across the directory
  - apply heatmap color classes to each model pill and/or badge
- [x] Add click-to-copy on each model item:
  - copy exact model ID string (no trailing comma)
  - use the existing copy/toast mechanism
- [x] Tests:
  - unit test heatmap bucketing
  - component test for per-model click-to-copy
- [x] Run `npm run test`, `npm run lint`, `npm run build`.
