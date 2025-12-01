import { prisma } from "@/lib/prisma";
import { LeaveStatus, LeaveType, Prisma } from "@prisma/client";

export interface SearchFilters {
  // Text search
  query?: string; // Search in reason, employee name

  // Leave filters
  status?: LeaveStatus | LeaveStatus[];
  type?: LeaveType | LeaveType[];
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;

  // Employee filters
  requesterId?: number;
  department?: string;

  // Advanced filters
  workingDaysMin?: number;
  workingDaysMax?: number;
  needsCertificate?: boolean;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?:
    | "createdAt"
    | "startDate"
    | "endDate"
    | "workingDays"
    | "status";
  sortOrder?: "asc" | "desc";
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * AdvancedSearchService
 *
 * Provides advanced filtering and full-text search capabilities
 */
export class AdvancedSearchService {
  /**
   * Search leave requests with advanced filters
   */
  static async searchLeaves(
    filters: SearchFilters,
    userId?: number,
    userRole?: string
  ): Promise<SearchResult<any>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.LeaveRequestWhereInput = {};

      // Text search (full-text)
      if (filters.query) {
        where.OR = [
          { reason: { contains: filters.query, mode: "insensitive" } },
          {
            requester: {
              name: { contains: filters.query, mode: "insensitive" },
            },
          },
          {
            requester: {
              email: { contains: filters.query, mode: "insensitive" },
            },
          },
        ];
      }

      // Status filter
      if (filters.status) {
        where.status = Array.isArray(filters.status)
          ? { in: filters.status }
          : filters.status;
      }

      // Type filter
      if (filters.type) {
        where.type = Array.isArray(filters.type)
          ? { in: filters.type }
          : filters.type;
      }

      // Date filters
      if (filters.startDateFrom || filters.startDateTo) {
        where.startDate = {};
        if (filters.startDateFrom) {
          where.startDate.gte = filters.startDateFrom;
        }
        if (filters.startDateTo) {
          where.startDate.lte = filters.startDateTo;
        }
      }

      if (filters.endDateFrom || filters.endDateTo) {
        where.endDate = {};
        if (filters.endDateFrom) {
          where.endDate.gte = filters.endDateFrom;
        }
        if (filters.endDateTo) {
          where.endDate.lte = filters.endDateTo;
        }
      }

      // Employee filters
      if (filters.requesterId) {
        where.requesterId = filters.requesterId;
      }

      if (filters.department) {
        where.requester = {
          department: filters.department,
        };
      }

      // Working days range
      if (filters.workingDaysMin !== undefined || filters.workingDaysMax !== undefined) {
        where.workingDays = {};
        if (filters.workingDaysMin !== undefined) {
          where.workingDays.gte = filters.workingDaysMin;
        }
        if (filters.workingDaysMax !== undefined) {
          where.workingDays.lte = filters.workingDaysMax;
        }
      }

      // Certificate requirement
      if (filters.needsCertificate !== undefined) {
        where.needsCertificate = filters.needsCertificate;
      }

      // Sorting
      const orderBy: Prisma.LeaveRequestOrderByWithRelationInput = {};
      const sortBy = filters.sortBy || "createdAt";
      const sortOrder = filters.sortOrder || "desc";
      orderBy[sortBy] = sortOrder;

      // Execute query
      const [leaves, total] = await Promise.all([
        prisma.leaveRequest.findMany({
          where,
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                empCode: true,
                department: true,
              },
            },
            approvals: {
              include: {
                approver: {
                  select: {
                    name: true,
                    role: true,
                  },
                },
              },
              orderBy: {
                step: "asc",
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.leaveRequest.count({ where }),
      ]);

      return {
        data: leaves,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("[AdvancedSearchService] Error searching leaves:", error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }
  }

  /**
   * Get available filter options (for dropdown population)
   */
  static async getFilterOptions(userId?: number) {
    try {
      const [departments, leaveTypes, statuses] = await Promise.all([
        // Get unique departments
        prisma.user.findMany({
          where: {
            department: { not: null },
          },
          select: {
            department: true,
          },
          distinct: ["department"],
        }),

        // Leave types (from enum)
        Promise.resolve(Object.values(LeaveType)),

        // Leave statuses (from enum)
        Promise.resolve(Object.values(LeaveStatus)),
      ]);

      return {
        departments: departments
          .map((d) => d.department)
          .filter(Boolean) as string[],
        leaveTypes,
        statuses,
      };
    } catch (error) {
      console.error(
        "[AdvancedSearchService] Error getting filter options:",
        error
      );
      return {
        departments: [],
        leaveTypes: [],
        statuses: [],
      };
    }
  }

  /**
   * Save search filter as preset
   */
  static async saveFilterPreset(
    userId: number,
    name: string,
    filters: SearchFilters
  ) {
    try {
      // Store in user metadata (you could create a separate FilterPreset model)
      // For now, we'll use JSON storage in user or a separate table
      // This is a placeholder for the implementation
      return {
        success: true,
        presetId: Date.now(), // Temporary
      };
    } catch (error) {
      console.error(
        "[AdvancedSearchService] Error saving filter preset:",
        error
      );
      return {
        success: false,
      };
    }
  }
}
