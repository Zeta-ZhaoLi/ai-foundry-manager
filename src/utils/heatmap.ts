export type HeatmapBucket = 0 | 1 | 2 | 3 | 4;

export const getHeatmapBucket = (
  count: number,
  maxCount: number
): HeatmapBucket => {
  if (!Number.isFinite(count) || count <= 0) return 0;
  if (!Number.isFinite(maxCount) || maxCount <= 0) return 0;

  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

export const getMasterModelHeatmapClasses = (
  count: number,
  maxCount: number
): { pillColorClassName: string; badgeColorClassName: string } => {
  const bucket = getHeatmapBucket(count, maxCount);

  // IMPORTANT: Return only color-related Tailwind classes.
  // Do not include layout/shape classes.
  switch (bucket) {
    case 0:
      return {
        pillColorClassName: 'border-border bg-muted/40 dark:bg-muted/20',
        badgeColorClassName: 'bg-muted text-muted-foreground',
      };
    case 1:
      return {
        pillColorClassName:
          'border-sky-500/30 bg-sky-500/10 dark:border-sky-400/25 dark:bg-sky-400/10',
        badgeColorClassName:
          'bg-sky-500 text-white dark:bg-sky-400 dark:text-black',
      };
    case 2:
      return {
        pillColorClassName:
          'border-cyan-500/30 bg-cyan-500/10 dark:border-cyan-400/25 dark:bg-cyan-400/10',
        badgeColorClassName:
          'bg-cyan-500 text-black dark:bg-cyan-400 dark:text-black',
      };
    case 3:
      return {
        pillColorClassName:
          'border-amber-500/35 bg-amber-500/10 dark:border-amber-400/25 dark:bg-amber-400/10',
        badgeColorClassName:
          'bg-amber-500 text-black dark:bg-amber-400 dark:text-black',
      };
    case 4:
      return {
        pillColorClassName:
          'border-rose-500/35 bg-rose-500/10 dark:border-rose-400/25 dark:bg-rose-400/10',
        badgeColorClassName:
          'bg-rose-600 text-white dark:bg-rose-400 dark:text-black',
      };
  }
};
