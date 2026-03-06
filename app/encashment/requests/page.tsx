import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { EncashmentRequestsContent } from "./components/EncashmentRequestsContent";
import { Skeleton } from "@/components/ui/skeleton";

export default async function EncashmentRequestsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const allowedRoles = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"];
    if (!allowedRoles.includes(user.role as string)) {
        redirect("/dashboard");
    }

    return (
        <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <EncashmentRequestsContent />
        </Suspense>
    );
}
