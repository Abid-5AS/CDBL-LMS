import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const cache = "no-store";

type AlertType = "low_balance" | "year_end_lapse" | "upcoming_leave" | "certificate_reminder";

interface Alert {
  type: AlertType;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
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

  const alerts: Alert[] = [];

  // Fetch balances
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year },
  });

  const remaining = (type: string) => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;
    return (record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0);
  };

  const earned = remaining("EARNED");
  const casual = remaining("CASUAL");
  const medical = remaining("MEDICAL");

  // Low balance warnings
  if (casual < 3 && casual > 0) {
    alerts.push({
      type: "low_balance",
      severity: "warning",
      title: "Low Casual Leave Balance",
      message: `You have only ${casual} ${casual === 1 ? "day" : "days"} of Casual Leave remaining.`,
      action: { label: "Apply Leave", href: "/leaves/apply" },
    });
  }

  if (medical < 5 && medical > 0) {
    alerts.push({
      type: "low_balance",
      severity: "warning",
      title: "Low Medical Leave Balance",
      message: `You have only ${medical} ${medical === 1 ? "day" : "days"} of Medical Leave remaining.`,
      action: { label: "Apply Leave", href: "/leaves/apply" },
    });
  }

  // Year-end lapse warning for Casual Leave
  const currentMonth = today.getMonth();
  if (currentMonth >= 10 && casual > 0) {
    // November or December
    const monthName = currentMonth === 10 ? "November" : "December";
    alerts.push({
      type: "year_end_lapse",
      severity: "info",
      title: "Casual Leave Lapse Reminder",
      message: `Casual Leave expires on December 31st. Use your ${casual} remaining ${casual === 1 ? "day" : "days"} before they lapse.`,
      action: { label: "View Requests", href: "/leaves" },
    });
  }

  // Upcoming approved leaves within 7 days
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const upcomingLeaves = await prisma.leaveRequest.findMany({
    where: {
      requesterId: me.id,
      status: "APPROVED",
      startDate: {
        gte: today,
        lte: sevenDaysFromNow,
      },
    },
    orderBy: { startDate: "asc" },
    take: 1,
  });

  if (upcomingLeaves.length > 0) {
    const leave = upcomingLeaves[0];
    const leaveDate = new Date(leave.startDate);
    const daysUntil = Math.ceil((leaveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    alerts.push({
      type: "upcoming_leave",
      severity: "info",
      title: "Upcoming Approved Leave",
      message: `Your ${leave.type} leave starts in ${daysUntil} ${daysUntil === 1 ? "day" : "days"} (${leaveDate.toLocaleDateString("en-GB")}).`,
      action: { label: "View Details", href: "/leaves" },
    });
  }

  // Medical certificate reminders for approved leaves > 3 days
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

    alerts.push({
      type: "certificate_reminder",
      severity: "warning",
      title: "Medical Certificate Required",
      message: `Your ${leave.workingDays}-day Medical Leave starts in ${daysUntil} ${daysUntil === 1 ? "day" : "days"}. Please upload your medical certificate.`,
      action: { label: "View Request", href: "/leaves" },
    });
  }

  return NextResponse.json({ alerts });
}

