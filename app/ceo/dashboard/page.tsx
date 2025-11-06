import { redirect } from "next/navigation";

/**
 * Legacy route - redirects to new role-based dashboard
 * @deprecated Use /dashboard/ceo instead
 */
export default function CEODashboardRedirect() {
  redirect("/dashboard/ceo");
}
