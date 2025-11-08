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
    <div className="rounded-lg border border-bg-muted bg-bg-primary p-4">
      <div className="text-xs font-semibold tracking-wide text-text-muted uppercase">
        {title}
      </div>
      <div className="text-2xl font-bold mt-1 text-text-primary">{value}</div>
      {hint ? <div className="text-xs text-text-muted mt-1">{hint}</div> : null}
    </div>
  );
}
