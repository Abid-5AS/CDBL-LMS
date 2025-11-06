import { redirect } from "next/navigation";

/**
 * Legacy route - redirects to new role-based dashboard
 * @deprecated Use /dashboard/hr-head instead
 */
export default function HRHeadDashboardRedirect() {
  redirect("/dashboard/hr-head");
}
