import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { policy } from "@/lib/policy";
import { normalizeToDhakaMidnight } from "@/lib/date-utils";
import { countWorkingDays } from "@/lib/working-days";

export const cache = "no-store";

interface Insight {
  kind: string;
  text: string;
  meta?: Record<string, any>;
}

export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const insights: Insight[] = [];
  const currentYear = new Date().getFullYear();
  const today = normalizeToDhakaMidnight(new Date());
  const yearEnd = normalizeToDhakaMidnight(new Date(currentYear, 11, 31)); // Dec 31

  // Get balances for current year
  const balances = await prisma.balance.findMany({
    where: { userId: me.id, year: currentYear },
  });

  const getRemaining = (type: string) => {
    const record = balances.find((b) => b.type === type);
    if (!record) return 0;
    return record.closing ?? Math.max((record.opening ?? 0) + (record.accrued ?? 0) - (record.used ?? 0), 0);
  };

  const earnedRemaining = getRemaining("EARNED");
  const casualRemaining = getRemaining("CASUAL");

  // Insight 1: Earned Leave expiring soon (carry-forward cap)
  if (earnedRemaining > 0) {
    const daysUntilYearEnd = Math.ceil((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if carry-forward applies and if there's risk of losing days
    const earnedBalance = balances.find((b) => b.type === "EARNED");
    if (earnedBalance) {
      const totalEarned = (earnedBalance.opening ?? 0) + (earnedBalance.accrued ?? 0);
      const carryForwardCap = policy.carryForwardCap.EARNED || 60;
      
      // If total earned exceeds carry forward cap, warn about expiring days
      if (totalEarned > carryForwardCap && daysUntilYearEnd < 90) {
        const daysAtRisk = Math.min(earnedRemaining, totalEarned - carryForwardCap);
        if (daysAtRisk > 0) {
          insights.push({
            kind: "EL_LAPSE_WARNING",
            text: `EL carries forward up to 60 days. You have ${daysAtRisk} day${daysAtRisk > 1 ? "s" : ""} at risk. Plan usage.`,
            meta: { remaining: earnedRemaining, atRisk: daysAtRisk },
          });
        }
      } else if (earnedRemaining > 0 && daysUntilYearEnd < 60) {
        insights.push({
          kind: "EL_REMINDER",
          text: `You have ${earnedRemaining} unused Earned Leave day${earnedRemaining > 1 ? "s" : ""}. Consider planning your leave before Dec 31.`,
          meta: { remaining: earnedRemaining },
        });
      }
    }
  }

  // Insight 2: Casual Leave lapse risk
  if (casualRemaining > 0) {
    const daysUntilYearEnd = Math.ceil((yearEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilYearEnd < 90) {
      insights.push({
        kind: "CL_LAPSE_RISK",
        text: `${casualRemaining} day${casualRemaining > 1 ? "s" : ""} of Casual Leave remaining — plan early to avoid lapse at year-end.`,
        meta: { remaining: casualRemaining },
      });
    }
  }

  // Insight 3: Consecutive working days for planning
  // Get holidays for the next 30 days
  const next30Days = new Date(today);
  next30Days.setDate(next30Days.getDate() + 30);
  
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: today,
        lte: next30Days,
      },
    },
    select: { date: true },
  });

  const holidayDates = holidays.map((h) => normalizeToDhakaMidnight(h.date));

  // Find consecutive working days (excluding weekends and holidays)
  let maxConsecutive = 0;
  let currentStreak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 30; i++) {
    const check = normalizeToDhakaMidnight(checkDate);
    const dayOfWeek = check.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri/Sat
    const isHoliday = holidayDates.some((hd) => 
      hd.getTime() === check.getTime()
    );

    if (!isWeekend && !isHoliday) {
      currentStreak++;
      maxConsecutive = Math.max(maxConsecutive, currentStreak);
    } else {
      currentStreak = 0;
    }

    checkDate.setDate(checkDate.getDate() + 1);
  }

  if (maxConsecutive >= 5) {
    insights.push({
      kind: "PLANNING_OPPORTUNITY",
      text: `${maxConsecutive} consecutive working days ahead — perfect time to plan a short break.`,
      meta: { consecutiveDays: maxConsecutive },
    });
  }

  // Insight 4: Check for pending requests that need attention
  const pendingRequests = await prisma.leaveRequest.count({
    where: {
      requesterId: me.id,
      status: { in: ["RETURNED", "CANCELLATION_REQUESTED"] },
    },
  });

  if (pendingRequests > 0) {
    insights.push({
      kind: "PENDING_ACTION",
      text: `You have ${pendingRequests} leave request${pendingRequests > 1 ? "s" : ""} that require${pendingRequests === 1 ? "s" : ""} your attention.`,
      meta: { count: pendingRequests },
    });
  }

  // Insight 5: Team overlap (colleagues on leave today)
  const currentUser = await prisma.user.findUnique({
    where: { id: me.id },
    select: { deptHeadId: true },
  });

  if (currentUser?.deptHeadId) {
    const teamMembers = await prisma.user.findMany({
      where: {
        deptHeadId: currentUser.deptHeadId,
        id: { not: me.id },
      },
      select: { id: true },
    });

    if (teamMembers.length > 0) {
      const teamMemberIds = teamMembers.map((m) => m.id);
      const teamOnLeaveToday = await prisma.leaveRequest.count({
        where: {
          requesterId: { in: teamMemberIds },
          status: "APPROVED",
          startDate: { lte: today },
          endDate: { gte: today },
        },
      });

      if (teamOnLeaveToday > 0) {
        const dayOfWeek = today.getDay();
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = dayNames[dayOfWeek];
        
        insights.push({
          kind: "TEAM_OVERLAP",
          text: `${teamOnLeaveToday} colleague${teamOnLeaveToday > 1 ? "s are" : " is"} on leave this ${dayName}.`,
          meta: { count: teamOnLeaveToday, date: today.toISOString().slice(0, 10) },
        });
      }
    }
  }

  return NextResponse.json({ insights });
}
