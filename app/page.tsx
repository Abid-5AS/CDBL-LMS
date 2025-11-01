import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  noStore();
  const user = await getCurrentUser();
  
  if (user) {
    // User is authenticated, redirect based on role
    const role = user.role as string;
    if (role === "HR_ADMIN") {
      redirect("/approvals");
    }
    if (role === "CEO") {
      redirect("/admin");
    }
    redirect("/dashboard");
  }
  
  // User is not authenticated, redirect to login
  redirect("/login");
}
