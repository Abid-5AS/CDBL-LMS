"use server";

import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function redirectAfterLogin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "HR_ADMIN") {
    redirect("/approvals");
  }
  redirect("/dashboard");
}
