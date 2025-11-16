import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeaveCalendarView } from "./_components/LeaveCalendarView";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

async function LeaveCalendarPageContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Leave Calendar
          </h1>
          <p className="text-muted-foreground mt-2">
            View team leaves in calendar format
          </p>
        </div>

        <LeaveCalendarView currentUserRole={user.role} />
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Card className="rounded-2xl border-muted shadow-sm">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">
                Loading calendar...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
