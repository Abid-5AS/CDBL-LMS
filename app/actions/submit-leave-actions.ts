"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { LeaveService } from "@/lib/services/leave.service";
import { LeaveType } from "@/src/generated/prisma/client";
import { z } from "zod";

// Define the return state type
export type SubmitLeaveState = {
  success: boolean;
  error?: string;
  id?: number;
  message?: string;
};

// Robust Zod Schema
const SubmitLeaveRequestSchema = z.object({
  type: z.nativeEnum(LeaveType),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid start date" }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid end date" }),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  needsCertificate: z.coerce.boolean().optional().default(false),
  incidentDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), { message: "Invalid incident date" }),
});

export async function submitLeaveRequestWithState(
  prevState: SubmitLeaveState,
  formData: FormData
): Promise<SubmitLeaveState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Extract raw data for validation
    const rawData = {
      type: formData.get("type"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      reason: formData.get("reason"),
      needsCertificate: formData.get("needsCertificate") === "true" || formData.get("needsCertificate") === "on",
      incidentDate: formData.get("incidentDate") || undefined,
    };

    const file = formData.get("certificate") as File | null;

    // Validate using Zod
    const validatedData = SubmitLeaveRequestSchema.parse(rawData);

    // Convert dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    const incidentDate = validatedData.incidentDate ? new Date(validatedData.incidentDate) : undefined;

    // Prepare payload
    const payload = {
      type: validatedData.type,
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