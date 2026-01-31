import { Suspense } from "react";
import { NotificationsList } from "./_components/NotificationsList";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Notifications | CDBL LMS",
  description: "View all your notifications",
};

export default function NotificationsPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with all your leave management notifications
        </p>
      </div>

      <Suspense fallback={<NotificationsListSkeleton />}>
        <NotificationsList />
      </Suspense>
    </div>
  );
}

function NotificationsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="border rounded-lg p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
