"use server";

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function redirectAfterLogin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (["dept_head", "hr_admin", "hr_head", "ceo"].includes(user.role)) {
    redirect("/approvals");
  }
  redirect("/dashboard");
}
