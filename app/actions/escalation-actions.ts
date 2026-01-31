"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated/prisma/client";
import { revalidatePath } from "next/cache";

export type EscalationRuleState = {
  success?: boolean;
  error?: string;
};

export async function createEscalationRule(
  prevState: EscalationRuleState,
  formData: FormData
): Promise<EscalationRuleState> {
  try {
    const user = await getCurrentUser();
    if (!user || !["HR_ADMIN", "SYSTEM_ADMIN", "CEO"].includes(user.role)) {
      return { error: "Unauthorized" };
    }

    const role = formData.get("role") as Role;
    const timeoutHours = Number(formData.get("timeoutHours"));
    const escalateToRole = formData.get("escalateToRole") as Role;

    if (!role || !timeoutHours || !escalateToRole) {
      return { error: "All fields are required" };
    }

    if (role === escalateToRole) {
      return { error: "Cannot escalate to the same role" };
    }

    await prisma.escalationRule.create({
      data: {
        role,
        timeoutHours,
        escalateToRole,
      },
    });

    revalidatePath("/admin/escalation-rules");
    return { success: true };
  } catch (error) {
    console.error("Create rule error:", error);
    return { error: "Failed to create rule" };
  }
}

export async function deleteEscalationRule(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || !["HR_ADMIN", "SYSTEM_ADMIN", "CEO"].includes(user.role)) {
      throw new Error("Unauthorized");
    }

    await prisma.escalationRule.delete({
      where: { id },
    });

    revalidatePath("/admin/escalation-rules");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete rule" };
  }
}

export async function toggleEscalationRule(id: number, isActive: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || !["HR_ADMIN", "SYSTEM_ADMIN", "CEO"].includes(user.role)) {
      throw new Error("Unauthorized");
    }

    await prisma.escalationRule.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/admin/escalation-rules");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update rule" };
  }
}
