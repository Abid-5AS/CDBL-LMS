import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageForRole, type UserRole } from "@/lib/ui/navigation";

export const dynamic = "force-dynamic";

/**
 * Dashboard redirect hub - redirects users to their role-specific dashboard
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.role as UserRole;
  const homePage = getHomePageForRole(role);

  // Redirect to role-specific dashboard
  redirect(homePage);
}
