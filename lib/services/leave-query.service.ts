import { prisma } from "@/lib/prisma";
import { ServiceResult } from "./leave.service";

export class LeaveQueryService {
  /**
   * Get team leave requests for department head with filters and pagination
   */
  static async getTeamLeaveRequests(
    deptHeadId: number,
    filters: {
      search?: string;
      status?: string;
      type?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<
    ServiceResult<{
      rows: any[];
      total: number;
      counts: {
        pending: number;
        forwarded: number;
        returned: number;
        cancelled: number;
      };
    }>
  > {
    try {
      const {
        search = "",
        status = "PENDING",
        type = "ALL",
        page = 1,
        pageSize = 10,
      } = filters;

      // Get team members
      const teamMembers = await prisma.user.findMany({
        where: { deptHeadId },
        select: { id: true },
      });
      const teamMemberIds = teamMembers.map((m) => m.id);

      // If no team members, return empty results
      if (teamMemberIds.length === 0) {
        return {
          success: true,
          data: {
            rows: [],
            total: 0,
            counts: {
              pending: 0,
              forwarded: 0,
              returned: 0,
              cancelled: 0,
            },
          },
        };
      }

      // Build where clause
      const where: any = {
        requesterId: { in: teamMemberIds },
      };

      // Status filter
      if (status !== "ALL") {
        where.status = status;
      }

      // Type filter
      if (type !== "ALL") {
        where.type = type;
      }

      // Search filter (requester name)
      if (search) {
        where.requester = {
          name: {
            contains: search,
            mode: "insensitive",
          },
        };
      }

      // Calculate pagination
      const skip = (page - 1) * pageSize;

      const baseDept = { requesterId: { in: teamMemberIds } };

      // Execute all queries in parallel
      const [
        [rows, total],
        [pending, forwarded, returned, cancelled]
      ] = await Promise.all([
        // 1. Fetch rows and total count
        Promise.all([
          prisma.leaveRequest.findMany({
            where,
            include: {
              requester: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                },
              },
              approvals: {
                orderBy: { step: "desc" },
                take: 1,
                include: {
                  approver: {
                    select: {
                      name: true,
                      role: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: pageSize,
          }),
          prisma.leaveRequest.count({ where }),
        ]),
        
        // 2. Fetch status counts
        Promise.all([
          prisma.leaveRequest.count({
            where: {
              ...baseDept,
              status: { in: ["PENDING", "SUBMITTED"] },
              AND: [
                {
                  approvals: {
                    some: {
                      decision: "FORWARDED",
                      toRole: "DEPT_HEAD",
                    },
                  },
                },
                {
                  approvals: {
                    none: {
                      approverId: deptHeadId,
                      decision: {
                        in: ["FORWARDED", "APPROVED", "REJECTED"],
                      },
                    },
                  },
                },
              ],
            },
          }),
          prisma.leaveRequest.count({
            where: {
              ...baseDept,
              status: "PENDING",
              approvals: {
                some: {
                  decision: "FORWARDED",
                  approverId: deptHeadId,
                  toRole: { not: null },
                },
              },
            },
          }),
          prisma.leaveRequest.count({
            where: {
              ...baseDept,
              status: "RETURNED",
              approvals: {
                some: {
                  approverId: deptHeadId,
                  decision: "FORWARDED",
                  toRole: null,
                },
              },
            },
          }),
          prisma.leaveRequest.count({
            where: {
              ...baseDept,
              status: "CANCELLED",
            },
          }),
        ])
      ]);

      return {
        success: true,
        data: {
          rows,
          total,
          counts: {
            pending,
            forwarded,
            returned,
            cancelled,
          },
        },
      };
    } catch (error) {
      console.error("LeaveQueryService.getTeamLeaveRequests error:", error);
      return {
        success: false,
        error: {
          code: "fetch_error",
          message: "Failed to fetch team leave requests",
        },
      };
    }
  }
}
