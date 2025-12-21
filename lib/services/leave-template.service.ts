import { prisma } from "@/lib/prisma";
import { LeaveType } from "@/src/generated/prisma/client";

export interface LeaveTemplateData {
  name: string;
  leaveType: LeaveType;
  duration: number;
  reason: string;
  isShared?: boolean;
}

/**
 * LeaveTemplateService
 *
 * Manages leave application templates for quick reuse
 */
export class LeaveTemplateService {
  static async createTemplate(userId: number, data: LeaveTemplateData) {
    return await prisma.leaveTemplate.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  static async getTemplates(userId: number) {
    return await prisma.leaveTemplate.findMany({
      where: {
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async deleteTemplate(templateId: number, userId: number) {
    return await prisma.leaveTemplate.deleteMany({
      where: {
        id: templateId,
        userId, // Only owner can delete
      },
    });
  }
}
