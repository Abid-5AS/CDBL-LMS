export function countRequestedDays(start?: Date, end?: Date): number {
  if (!start || !end) return 0;
  const s = new Date(Math.min(start.getTime(), end.getTime()));
  const e = new Date(Math.max(start.getTime(), end.getTime()));
  // inclusive calendar days: e.g., 23 Oct to 28 Oct = 6 days
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diff = Math.round((e.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0)) / MS_PER_DAY);
  return diff + 1;
}
