import { prisma } from "@/lib/prisma";
import { AppRole } from "@/lib/rbac";
import { Role, LeaveType } from "@/src/generated/prisma/client";

// Default Matrix (Fallback)
const DEFAULT_ROLE_WORKFLOW_MATRIX: Record<AppRole, Role[]> = {
    EMPLOYEE: ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"],
    DEPT_HEAD: ["HR_HEAD", "CEO"],
    HR_ADMIN: ["HR_HEAD", "CEO"],
    HR_HEAD: ["CEO"],
    CEO: [],
    SYSTEM_ADMIN: []
};

export class WorkflowService {
    /**
     * Get the active approval chain for a specific requester role.
     * Prioritizes Database Policy > Default Matrix
     */
    static async getChainFor(requesterRole: AppRole, leaveType?: LeaveType): Promise<Role[]> {
        try {
            // 1. Try to find a policy in the DB
            const policy = await prisma.workflowPolicy.findFirst({
                where: {
                    requesterRole: requesterRole as any, // Cast to Prisma Role enum if compatible
                    isActive: true,
                },
            });

            if (policy && policy.chain) {
                // Validate and cast the JSON chain
                const chain = policy.chain as string[];
                // Filter out any invalid roles just in case
                return chain.filter(r => Object.values(Role).includes(r as Role)) as Role[];
            }
        } catch (error) {
            console.error("Failed to fetch workflow policy from DB", error);
        }

        // 2. Fallback to default matrix
        return DEFAULT_ROLE_WORKFLOW_MATRIX[requesterRole] || [];
    }

    /**
     * Update or Create a workflow policy for a role
     */
    static async updatePolicy(requesterRole: AppRole, chain: Role[], adminId: number) {
        // Upsert the policy
        return prisma.workflowPolicy.upsert({
            where: {
                requesterRole: requesterRole as any,
            },
            update: {
                chain: chain,
                updatedBy: adminId,
                isActive: true,
            },
            create: {
                requesterRole: requesterRole as any,
                chain: chain,
                updatedBy: adminId,
                isActive: true, // Default to active
            },
        });
    }

    /**
     * Get all configured policies
     */
    static async getAllPolicies() {
        const policies = await prisma.workflowPolicy.findMany({
            include: {
                updatedByUser: {
                    select: { name: true, email: true }
                }
            }
        });

        // Merge with defaults to show comprehensive list
        const defaults = Object.entries(DEFAULT_ROLE_WORKFLOW_MATRIX).map(([role, chain]) => ({
            requesterRole: role,
            chain,
            isDefault: true,
            isActive: true
        }));

        return { policies, defaults };
    }
}
