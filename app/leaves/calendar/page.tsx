import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeaveCalendarView } from "./_components/LeaveCalendarView";
import { Calendar } from "lucide-react";
import { LeaveSectionNav } from "@/components/layout/SectionNav";
import { Card, CardContent } from "@/components/ui/card";

async function LeaveCalendarPageContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 px-4 sm:px-6 lg:px-0 py-8">
      <LeaveSectionNav />
      <div className="flex flex-col gap-2">
        <h1 className="heading-lg flex items-center gap-2">
          <Calendar className="icon-md" />
          Leave Calendar
        </h1>
        <p className="body-muted">View team leaves in calendar format.</p>
      </div>
      <LeaveCalendarView currentUserRole={user.role} />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-4 px-4 sm:px-6 lg:px-0 py-8">
      <div className="h-10 rounded-xl bg-surface-2 border border-outline/60 dark:border-border" />
      <Card className="rounded-2xl border-outline/60 dark:border-border shadow-card">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Loading calendar...
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LeaveCalendarPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LeaveCalendarPageContent />
    </Suspense>
  );
}
