import { redirect } from "next/navigation";

/**
 * Legacy route - redirects to new role-based dashboard
 * @deprecated Use /dashboard/dept-head instead
 */
export default function ManagerDashboardRedirect() {
  redirect("/dashboard/dept-head");
}
