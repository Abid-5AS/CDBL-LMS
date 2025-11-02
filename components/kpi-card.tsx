export default function KpiCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-[var(--border-subtle)] bg-white dark:bg-[var(--bg-surface)] p-4">
      <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-[var(--text-secondary)] uppercase">
        {title}
      </div>
      <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-[var(--text-primary)]">{value}</div>
      {hint ? <div className="text-xs text-slate-500 dark:text-[var(--text-secondary)] mt-1">{hint}</div> : null}
    </div>
  );
}
