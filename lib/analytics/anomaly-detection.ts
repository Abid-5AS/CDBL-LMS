import { LeaveRequest } from "@prisma/client";
import { differenceInDays, getDay, isFriday, isMonday, subDays } from "date-fns";

export interface AnomalyResult {
    type: "FREQUENCY_SPIKE" | "PATTERN_MONDAY_FRIDAY" | "LAST_MINUTE" | "LONG_DURATION";
    description: string;
    severity: "low" | "medium" | "high";
    date: string;
    confidence: number;
}

export function detectAnomalies(leaves: LeaveRequest[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    // 1. Check for Monday/Friday patterns
    const monFriLeaves = leaves.filter((leave) => {
        const start = new Date(leave.startDate);
        return isMonday(start) || isFriday(start);
    });

    if (leaves.length > 5 && monFriLeaves.length / leaves.length > 0.6) {
        anomalies.push({
            type: "PATTERN_MONDAY_FRIDAY",
            description: "High frequency of leaves on Mondays or Fridays (>60%)",
            severity: "medium",
            date: new Date().toISOString().slice(0, 10),
            confidence: 0.8,
        });
    }

    // 2. Check for Last Minute Requests (Zero Notice)
    const lastMinuteLeaves = leaves.filter((leave) => {
        const created = new Date(leave.createdAt);
        const start = new Date(leave.startDate);
        const notice = differenceInDays(start, created);
        return notice < 1 && leave.type !== "MEDICAL" && leave.type !== "CASUAL"; // Exclude emergency types
    });

    if (lastMinuteLeaves.length > 2) {
        anomalies.push({
            type: "LAST_MINUTE",
            description: `Multiple last-minute requests (${lastMinuteLeaves.length}) detected`,
            severity: "low",
            date: lastMinuteLeaves[0].startDate.toISOString().slice(0, 10),
            confidence: 0.9,
        });
    }

    // 3. Frequency Spike (Simple Moving Average check - simplified)
    // In a real system, we'd compare against historical average
    const recentLeaves = leaves.filter(l => {
        const daysSince = differenceInDays(new Date(), new Date(l.startDate));
        return daysSince < 30;
    });

    if (recentLeaves.length > 4) {
        anomalies.push({
            type: "FREQUENCY_SPIKE",
            description: "Unusual spike in leave frequency (4+ in 30 days)",
            severity: "medium",
            date: new Date().toISOString().slice(0, 10),
            confidence: 0.7
        });
    }

    return anomalies;
}
