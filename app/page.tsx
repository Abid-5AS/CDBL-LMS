import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getHomePageForRole, type UserRole } from "@/lib/navigation";

export default async function Home() {
  noStore();
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
