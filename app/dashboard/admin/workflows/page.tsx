import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { WorkflowContent } from "./components/WorkflowContent";
import { Skeleton } from "@/components/ui/skeleton";

export default async function WorkflowsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const allowedRoles = ["SYSTEM_ADMIN", "HR_ADMIN", "CEO"];
    if (!allowedRoles.includes(user.role as string)) {
        redirect("/dashboard");
    }

    return (
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <WorkflowContent />
        </Suspense>
    );
}
