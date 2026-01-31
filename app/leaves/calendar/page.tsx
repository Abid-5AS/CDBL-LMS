import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeaveCalendarView } from "./_components/LeaveCalendarView";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCalendarEvents } from "@/lib/services/calendar-service";

async function LeaveCalendarPageContent({ searchParams }: { searchParams: any }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(user.role);
  const isManager = ["DEPT_HEAD", "MANAGER"].includes(user.role);
  
  // Determine view
  const defaultView = isAdmin ? "heatmap" : (isManager ? "team" : "my");
  const view = (searchParams.view as string) || defaultView;
  
  const month = searchParams.month ? parseInt(searchParams.month as string) : new Date().getMonth();
  const year = searchParams.year ? parseInt(searchParams.year as string) : new Date().getFullYear();
  
  let initialEvents = undefined;
  
  // Only fetch if view is supported by our service (heatmap logic is separate)
  if (["my", "team", "department", "all"].includes(view)) {
     try {
        const result = await getCalendarEvents({
            userId: user.id,
            userRole: user.role,
            userDepartment: user.department,
            month,
            year,
            view: view as any,
        });
        
        // Transform to CalendarEvent format expected by frontend components
        initialEvents = result.events.map((e: any) => ({
            id: e.id,
            title: e.leaveType,
            startDate: e.startDate,
            endDate: e.endDate,
            type: e.leaveType,
            status: e.status,
            employeeName: e.employeeName,
            isHoliday: false
        }));
     } catch (error) {
         console.error("Error pre-fetching calendar events:", error);
     }
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 px-4 sm:px-6 lg:px-0 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="heading-lg flex items-center gap-2">
          <Calendar className="icon-md" />
          Leave Calendar
        </h1>
        <p className="body-muted">View team leaves in calendar format.</p>
      </div>
      <LeaveCalendarView 
        currentUserRole={user.role} 
        initialView={view}
        initialDate={new Date(year, month)}
        initialEvents={initialEvents}
      />
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

export default async function LeaveCalendarPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LeaveCalendarPageContent searchParams={searchParams} />
    </Suspense>
  );
}
