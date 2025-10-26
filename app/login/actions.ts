import { getCurrentUser } from "@/lib/auth";
import { canApprove, type AppRole } from "@/lib/rbac";
import { redirect } from "next/navigation";

export async function redirectAfterLogin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (canApprove(user.role as AppRole)) {
    redirect("/approvals");
  } else {
    redirect("/dashboard");
  }
}
