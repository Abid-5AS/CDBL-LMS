import { z } from "zod";

export const ENCASHMENT_POLICY = {
    MIN_BALANCE_TO_KEEP: 10, // Assumption: Must keep 10 days
    MAX_ENCASHMENT_PER_REQUEST: 15, // Assumption: Max 15 days at once
    MIN_SERVICE_YEARS: 1, // Assumption: Must be employed for 1 year
};

export const EncashmentRequestSchema = z.object({
    daysRequested: z.number().min(1, "Days requested must be at least 1"),
    reason: z.string().optional(),
});
