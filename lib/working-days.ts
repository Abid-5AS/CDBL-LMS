export function countWorkingDays(start?: Date, end?: Date): number {
  if (!start || !end) return 0;
  // ensure start <= end
  let s = new Date(start);
  let e = new Date(end);
  if (s > e) [s, e] = [e, s];

  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const day = d.getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    // Business days: Sun(0) to Thu(4). Weekends: Fri(5), Sat(6).
    if (day >= 0 && day <= 4) count++;
  }
  return count;
}
