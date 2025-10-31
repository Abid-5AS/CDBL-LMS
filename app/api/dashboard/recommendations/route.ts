import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

type RecommendationType = "holiday_bridge" | "balance_optimization" | "certificate_reminder" | "consecutive_warning";

interface Recommendation {
  type: RecommendationType;
  title: string;
  message: string;
  severity: "info" | "warning";
  action?: {
    label: string;
    href: string;
  };
}

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const year = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const recommendations: Recommendation[] = [];

  // Fetch balances
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year },
  });

  const remaining = (type: string) => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;
    return (record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0);
  };

  const casual = remaining("CASUAL");

  // Year-end lapse recommendation
  const currentMonth = today.getMonth();
  if (currentMonth >= 10 && casual > 0) {
    // November or December
    recommendations.push({
      type: "balance_optimization",
      title: "Use Casual Leave Before Year End",
      message: `You have ${casual} ${casual === 1 ? "day" : "days"} of Casual Leave remaining. These will expire on December 31st.`,
      severity: "warning",
      action: {
        label: "Apply Leave",
        href: "/leaves/apply?type=CASUAL",
      },
    });
  }

  // Fetch upcoming holidays in the next 60 days
  const sixtyDaysFromNow = new Date(today);
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  const upcomingHolidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: today,
        lte: sixtyDaysFromNow,
      },
      isOptional: false, // Only suggest bridging for mandatory holidays
    },
    orderBy: { date: "asc" },
    take: 10,
  });

  // Suggest holiday bridging if there are nearby holidays
  if (upcomingHolidays.length > 0 && casual > 0) {
    const holiday = upcomingHolidays[0];
    const holidayDate = new Date(holiday.date);
    const daysDiff = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Suggest bridging if holiday is within reasonable range (7-21 days ahead)
    if (daysDiff >= 7 && daysDiff <= 21) {
      // Check if employee already has leave around this holiday
      const existingLeaves = await prisma.leaveRequest.findMany({
        where: {
          requesterId: me.id,
          status: {
            in: ["SUBMITTED", "PENDING", "APPROVED"],
          },
          OR: [
            {
              startDate: {
                lte: holidayDate,
                gte: new Date(holidayDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
              },
            },
            {
              endDate: {
                gte: holidayDate,
                lte: new Date(holidayDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
              },
            },
          ],
        },
      });

      if (existingLeaves.length === 0) {
        const suggestedDaysBefore = Math.min(2, casual); // Suggest 1-2 days before
        recommendations.push({
          type: "holiday_bridge",
          title: "Extend Your Holiday Weekend",
          message: `Apply ${suggestedDaysBefore} ${suggestedDaysBefore === 1 ? "day" : "days"} of Casual Leave before ${holiday.name} (${holidayDate.toLocaleDateString("en-GB")}) to maximize your time off.`,
          severity: "info",
          action: {
            label: "Apply Leave",
            href: "/leaves/apply?type=CASUAL",
          },
        });
      }
    }
  }

  // Medical certificate reminder
  const medicalLeavesNeedingCertificate = await prisma.leaveRequest.findMany({
    where: {
      requesterId: me.id,
      type: "MEDICAL",
      status: "APPROVED",
      workingDays: {
        gt: 3,
      },
      startDate: {
        gte: today,
      },
      needsCertificate: false,
    },
    orderBy: { startDate: "asc" },
    take: 1,
  });

  if (medicalLeavesNeedingCertificate.length > 0) {
    const leave = medicalLeavesNeedingCertificate[0];
    const leaveDate = new Date(leave.startDate);
    const daysUntil = Math.ceil((leaveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil > 0 && daysUntil <= 7) {
      recommendations.push({
        type: "certificate_reminder",
        title: "Upload Medical Certificate",
        message: `Your ${leave.workingDays}-day Medical Leave starts in ${daysUntil} ${daysUntil === 1 ? "day" : "days"}. Please upload your medical certificate soon.`,
        severity: "warning",
        action: {
          label: "View Request",
          href: "/leaves",
        },
      });
    }
  }

  return NextResponse.json({ recommendations });
}

