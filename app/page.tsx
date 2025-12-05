import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageForRole, type UserRole } from "@/lib/ui/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  
  if (user) {
    // User is authenticated, redirect based on role
    const role = user.role as UserRole;
    const homePage = getHomePageForRole(role);
    redirect(homePage);
  }
  
  // User is not authenticated, redirect to login
  redirect("/login");
}
