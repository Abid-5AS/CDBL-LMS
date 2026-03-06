import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Suspense } from "react";
import { PayrollContent } from "./components/PayrollContent";

function PayrollSkeleton() {
    return (
        <div className="container mx-auto py-8">
            <div className="space-y-8">
                <div className="h-10 w-64 bg-muted rounded animate-pulse" />
                <div className="h-4 w-96 bg-muted rounded animate-pulse" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="h-64 bg-muted rounded animate-pulse" />
                    <div className="h-64 bg-muted rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export default async function PayrollPage() {
    const user = await getCurrentUser();
    if (!user || !["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role as string)) {
        redirect("/dashboard");
    }
    return (
        <Suspense fallback={<PayrollSkeleton />}>
            <PayrollContent />
        </Suspense>
    );
}
