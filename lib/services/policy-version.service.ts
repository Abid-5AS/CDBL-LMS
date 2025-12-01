import { prisma } from "@/lib/prisma";

export interface PolicyChange {
  field: string;
  oldValue: any;
  newValue: any;
  description: string;
}

/**
 * PolicyVersionService
 *
 * Tracks policy changes over time for compliance and audit
 */
export class PolicyVersionService {
  static async createVersion(
    version: string,
    changes: PolicyChange[],
    changedById: number,
    effectiveFrom: Date
  ) {
    return await prisma.policyVersion.create({
      data: {
        version,
        changes,
        changedBy: changedById,
        effectiveFrom,
      },
    });
  }

  static async getVersions() {
    return await prisma.policyVersion.findMany({
      include: {
        changedByUser: {
          select: { name: true, role: true },
        },
      },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  static async compareVersions(v1Id: number, v2Id: number) {
    const [version1, version2] = await Promise.all([
      prisma.policyVersion.findUnique({ where: { id: v1Id } }),
      prisma.policyVersion.findUnique({ where: { id: v2Id } }),
    ]);

    return { version1, version2 };
  }
}
