import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminHolidaysManagement } from "./components/AdminHolidaysManagement";

async function AdminHolidaysContent() {
  const user = await getCurrentUser();
  if (!user || !["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(user.role as string)) {
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
    <Suspense fallback={<AdminHolidaysSkeleton />}>
      <AdminHolidaysContent />
    </Suspense>
  );
}

function AdminHolidaysSkeleton() {
  return (
    <div className="w-full">
      <div className="space-y-4">
        <div className="h-10 w-48 bg-muted dark:bg-muted/80 rounded animate-pulse" />
        <div className="h-64 w-full bg-muted dark:bg-muted/80 rounded animate-pulse" />
      </div>
    </div>
  );
}

