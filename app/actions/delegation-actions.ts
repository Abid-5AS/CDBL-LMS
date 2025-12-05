"use server";

import { getCurrentUser } from "@/lib/auth";
import { DelegationService } from "@/lib/services/delegation-service";
import { LeaveType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type DelegationState = {
  success?: boolean;
  error?: string;
};

export async function createDelegation(
  prevState: DelegationState,
  formData: FormData
): Promise<DelegationState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: "Unauthorized" };
    }

    const delegateId = Number(formData.get("delegateId"));
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const reason = formData.get("reason") as string;
    const isPermanent = formData.get("isPermanent") === "on";
    
    // Handle leave types (if any selected)
    const leaveTypesRaw = formData.get("leaveTypes");
    let leaveTypes: LeaveType[] | undefined = undefined;
    if (leaveTypesRaw) {
      try {
        leaveTypes = JSON.parse(leaveTypesRaw as string);
      } catch (e) {
        // Ignore parse error
      }
    }

    if (!delegateId) {
      return { error: "Delegate is required" };
    }

    if (delegateId === Number(user.id)) {
      return { error: "You cannot delegate to yourself" };
    }

    await DelegationService.createDelegation(Number(user.id), delegateId, {
      startDate,
      endDate,
      reason,
      isPermanent,
      leaveTypes,
    });

    revalidatePath("/settings/delegation");
    return { success: true };
  } catch (error) {
    console.error("Delegation error:", error);
    return { error: error instanceof Error ? error.message : "Failed to create delegation" };
  }
}

export async function revokeDelegation(delegationId: number) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    await DelegationService.revokeDelegation(delegationId, Number(user.id));
    revalidatePath("/settings/delegation");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to revoke" };
  }
}
