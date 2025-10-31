import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UnifiedLayout } from "@/components/unified/UnifiedLayout";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const ENTITLEMENTS = [
  { type: "Casual Leave", entitlement: "15 days", notes: "Max 7 consecutive days" },
  { type: "Sick Leave", entitlement: "15 days", notes: "> 3 days requires medical certificate" },
  { type: "Earned Leave", entitlement: "Accrues monthly", notes: "Submit 15 days in advance" },
];

const POLICY_POINTS = [
  "Weekends within leave range count against leave balance.",
  "Earned leave may carry forward up to 60 days.",
  "Medical leave longer than 3 days must include a doctor's note.",
  "Casual leave can be backdated only with HR Admin approval.",
];

async function PoliciesPageWrapper() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole();
  const userData = { name: user.name, email: user.email };

  // Both Employee and HR Admin use unified layout
  if (role !== "EMPLOYEE" && role !== "HR_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <UnifiedLayout currentPage="Policies" role={role as "EMPLOYEE" | "HR_ADMIN"} user={userData}>
      <Suspense fallback={<PoliciesFallback />}>
        <PoliciesContent />
      </Suspense>
    </UnifiedLayout>
  );
}

function PoliciesContent() {
  const handleExportPDF = () => {
    // TODO: Implement actual PDF export
    window.print();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Leave Policy Overview</h1>
            <p className="mt-1 text-sm text-gray-600">
              Summary of entitlements and rules based on the CDBL Leave Management policy.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="rounded-full"
            aria-label="Export policies as PDF"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Annual Entitlements</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2">Leave Type</th>
                <th className="px-4 py-2">Entitlement</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {ENTITLEMENTS.map((item) => (
                <tr key={item.type} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 font-medium text-gray-900">{item.type}</td>
                  <td className="px-4 py-2 text-gray-700">{item.entitlement}</td>
                  <td className="px-4 py-2 text-gray-600">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Key Rules</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-gray-700">
          {POLICY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            For the complete policy document, please contact HR or refer to the internal documentation portal.
          </p>
        </div>
      </section>
    </div>
  );
}

function PoliciesFallback() {
  return (
    <div className="space-y-6">
      <div className="h-32 rounded-2xl border border-gray-200 bg-white p-6" />
      <div className="h-64 rounded-2xl border border-gray-200 bg-white p-6" />
      <div className="h-64 rounded-2xl border border-gray-200 bg-white p-6" />
    </div>
  );
}

export default function PoliciesPage() {
  return <PoliciesPageWrapper />;
}
