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
    <div className="surface-card bg-card-kpi/10 border-card-kpi/20 p-4">
      <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </div>
      <div className="text-2xl font-bold mt-1 text-foreground">{value}</div>
      {hint ? (
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      ) : null}
    </div>
  );
}
// ...existing code from components/kpi-card.tsx will be moved here
