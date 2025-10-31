import AppShell from "@/components/app-shell";

const ENTITLEMENTS = [
  { type: "Casual Leave", entitlement: "15 days", notes: "Max 7 consecutive days" },
  { type: "Sick Leave", entitlement: "15 days", notes: "> 3 days requires medical certificate" },
  { type: "Earned Leave", entitlement: "Accrues monthly", notes: "Submit 15 days in advance" },
];

const POLICY_POINTS = [
  "Weekends within leave range count against leave balance.",
  "Earned leave may carry forward up to 60 days.",
  "Medical leave longer than 3 days must include a doctor’s note.",
  "Casual leave can be backdated only with HR Admin approval.",
];

export default function PoliciesPage() {
  return (
    <AppShell title="Policies" pathname="/policies">
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Leave Policy Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Summary of entitlements and rules based on the CDBL Leave Management policy.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Annual Entitlements</h2>
          <table className="mt-4 w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Leave Type</th>
                <th className="px-4 py-2">Entitlement</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ENTITLEMENTS.map((item) => (
                <tr key={item.type} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{item.type}</td>
                  <td className="px-4 py-2 text-slate-700">{item.entitlement}</td>
                  <td className="px-4 py-2 text-slate-600">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Key Rules</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-700">
            {POLICY_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <a
            href="/policy.pdf"
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
          >
            Download full policy (PDF)
          </a>
        </section>
      </div>
    </AppShell>
  );
}
