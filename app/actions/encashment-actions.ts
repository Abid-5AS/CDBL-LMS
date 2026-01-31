"use server";

import { EncashmentService } from "@/lib/services/encashment.service";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitEncashmentRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const days = parseInt(formData.get("days") as string);
  const reason = formData.get("reason") as string;

  if (isNaN(days) || days <= 0) {
    return { success: false, error: "Invalid days requested" };
  }

  const result = await EncashmentService.requestEncashment(
    user.id,
    days,
    reason
  );

  if (result.success) {
    revalidatePath("/encashment");
    revalidatePath("/dashboard/hr-admin"); // Refresh admin dashboard
  }

  return result;
}

export async function approveEncashmentRequest(requestId: number) {
  const user = await getCurrentUser();
  if (!user || user.role !== "HR_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const result = await EncashmentService.approveEncashment(requestId, user.id);

  if (result.success) {
    revalidatePath("/dashboard/hr-admin");
    revalidatePath("/encashment"); // Refresh employee view
  }

  return result;
}

export async function rejectEncashmentRequest(
  requestId: number,
  reason: string
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "HR_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  const result = await EncashmentService.rejectEncashment(
    requestId,
    user.id,
    reason
  );

  if (result.success) {
    revalidatePath("/dashboard/hr-admin");
    revalidatePath("/encashment"); // Refresh employee view
  }

  return result;
}
