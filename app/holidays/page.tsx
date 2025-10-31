import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { UnifiedLayout } from "@/components/unified/UnifiedLayout";
import { getCurrentUser } from "@/lib/auth";
import { getUserRole } from "@/lib/session";
import { HolidaysList } from "./components/HolidaysList";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

async function HolidaysPageWrapper() {
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
    <UnifiedLayout currentPage="Holidays" role={role as "EMPLOYEE" | "HR_ADMIN"} user={userData}>
      <Suspense fallback={<HolidaysPageFallback />}>
        <HolidaysContent />
      </Suspense>
    </UnifiedLayout>
  );
}

async function HolidaysContent() {
  await connection();
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Company Holidays</h1>
            <p className="mt-1 text-sm text-gray-600">
              View upcoming holidays and calendar for {currentYear}
            </p>
          </div>
          <PDFExportButton />
        </div>
      </section>
      <Suspense fallback={<HolidaysListSkeleton />}>
        <HolidaysList />
      </Suspense>
    </div>
  );
}

function PDFExportButton() {
  const handleExport = () => {
    // TODO: Implement actual PDF export
    window.print();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="rounded-full"
      aria-label="Export holidays calendar as PDF"
    >
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  );
}

export default function HolidaysPage() {
  return <HolidaysPageWrapper />;
}

function HolidaysPageFallback() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="mt-2 h-4 w-96 bg-slate-100 rounded animate-pulse" />
      </section>
      <HolidaysListSkeleton />
    </div>
  );
}

function HolidaysListSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
