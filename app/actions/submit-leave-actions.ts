"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeaveService } from "@/lib/services/leave.service";
import type { LeaveType } from "@prisma/client";
import { z } from "zod";

const SubmitLeaveRequestSchema = z.object({
  type: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  needsCertificate: z.boolean().optional().default(false),
  incidentDate: z.string().optional(),
});

export async function submitLeaveRequestWithState(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Parse form data
    const rawType = formData.get("type") as string;
    const rawStartDate = formData.get("startDate") as string;
    const rawEndDate = formData.get("endDate") as string;
    const rawReason = formData.get("reason") as string;
    const rawNeedsCertificate = formData.get("needsCertificate") as string;
    const rawIncidentDate = formData.get("incidentDate") as string;
    
    const file = formData.get("certificate") as File | null;

    // Validate using Zod
    const validatedData = SubmitLeaveRequestSchema.parse({
      type: rawType,
      startDate: rawStartDate,
      endDate: rawEndDate,
      reason: rawReason,
      needsCertificate: rawNeedsCertificate === "true",
      incidentDate: rawIncidentDate || undefined,
    });

    // Convert dates from strings to Date objects
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const incidentDate = validatedData.incidentDate ? new Date(validatedData.incidentDate) : undefined;

    // Prepare payload
    const payload = {
      type: validatedData.type as LeaveType,
      startDate,
      endDate,
      reason: validatedData.reason,
      needsCertificate: validatedData.needsCertificate,
      incidentDate,
      certificateFile: file || undefined,
    };

    const result = await LeaveService.createLeaveRequest(user.id, payload);

    if (!result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to submit leave request",
      };
    }

    // Automatic cache invalidation
    revalidatePath("/leaves");
    revalidatePath("/leaves/apply");
    revalidatePath("/dashboard");

    return {
      success: true,
      id: result.data.id,
      message: "Leave request submitted successfully!"
    };
  } catch (error) {
    console.error("submitLeaveRequestWithState error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Validation error: " + error.issues.map(i => i.message).join(", ")
      };
    }
    
    return {
      success: false,
      error: "An unexpected error occurred: " + (error instanceof Error ? error.message : String(error)),
    };
  }
}