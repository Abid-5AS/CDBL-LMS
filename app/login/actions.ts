import { getCurrentUser } from "@/lib/auth";
import { canApprove } from "@/lib/rbac";
import { redirect } from "next/navigation";

export async function redirectAfterLogin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (canApprove(user.role as any)) {
    redirect("/approvals");
  } else {
    redirect("/dashboard");
  }
}
