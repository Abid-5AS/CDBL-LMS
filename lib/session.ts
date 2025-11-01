import { cookies } from "next/headers";
import { getCurrentUser } from "./auth-jwt";
import type { AppRole } from "./rbac";

export async function getUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  
  // Also check cookie as fallback
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("auth_user_role")?.value;
  
  // Prefer DB role, fallback to cookie
  const role = (user.role as string) || roleCookie;
  
  if (role === "HR_ADMIN" || role === "HR_HEAD" || role === "DEPT_HEAD" || role === "CEO" || role === "EMPLOYEE") {
    return role as AppRole;
  }
  
  return "EMPLOYEE"; // default
}

