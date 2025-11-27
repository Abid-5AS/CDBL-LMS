import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parseISO, format } from "date-fns";
import { getCachedAnalytics, CACHE_TTL } from "@/lib/analytics/cache";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const department = searchParams.get("department");

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    const startDate = parseISO(startDateParam);
    const endDate = parseISO(endDateParam);

    // Create a unique cache key based on params
    const cacheKey = `heatmap:${startDateParam}:${endDateParam}:${department || "all"}:${user.role}`;

    const data = await getCachedAnalytics(
      cacheKey,
      async () => {
        // Build where clause
        const where: any = {
          startDate: { gte: startDate },
          endDate: { lte: endDate },
          status: "APPROVED",
        };

        // Role-based filtering
        if (user.role === "EMPLOYEE") {
          where.requesterId = user.id;
        } else if (user.role === "DEPT_HEAD") {
          // Dept head sees their department
          where.requester = {
            department: user.department, // Assuming user has department field
          };
        } else if (department) {
          // HR/Admin can filter by department
          where.requester = {
            department: department,
          };
        }

        // Fetch leaves
        const leaves = await prisma.leaveRequest.findMany({
          where,
          select: {
            startDate: true,
            endDate: true,
            type: true,
            requester: {
              select: {
                name: true,
                department: true,
              },
            },
          },
        });

        // Aggregate by date
        const dateMap = new Map<string, { value: number; types: Set<string>; details: any[] }>();

        leaves.forEach((leave) => {
          let current = new Date(leave.startDate);
          const end = new Date(leave.endDate);

          while (current <= end) {
            const dateStr = format(current, "yyyy-MM-dd");

            if (!dateMap.has(dateStr)) {
              dateMap.set(dateStr, { value: 0, types: new Set(), details: [] });
            }

            const entry = dateMap.get(dateStr)!;
            entry.value += 1;
            entry.types.add(leave.type);
            entry.details.push({
              name: leave.requester.name,
              department: leave.requester.department,
              type: leave.type,
            });

            current.setDate(current.getDate() + 1);
          }
        });

        // Convert to array
        return Array.from(dateMap.entries()).map(([date, data]) => ({
          date,
          value: data.value,
          types: Array.from(data.types),
          details: data.details,
        }));
      },
      CACHE_TTL.AGGREGATION // Cache for 1 hour
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    return NextResponse.json(
      { error: "Failed to fetch heatmap data" },
      { status: 500 }
    );
  }
}
