import { Suspense } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { AdminHolidaysManagement } from "./components/AdminHolidaysManagement";

async function AdminHolidaysContent() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "HR_ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  return (
        <div className="w-full">
          <AdminHolidaysManagement />
        </div>
  );
}

export default function AdminHolidaysPage() {
  return (
    <AppShell title="Manage Holidays" pathname="/admin/holidays">
      <Suspense fallback={<AdminHolidaysSkeleton />}>
        <AdminHolidaysContent />
      </Suspense>
    </AppShell>
  );
}

function AdminHolidaysSkeleton() {
  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 w-full bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

