import "dotenv/config";
import { prisma } from "./lib/prisma";

async function main() {
    const user = await prisma.user.findUnique({
        where: { id: 5 },
    });
    console.log("User 5:", user);

    const { ApprovalRepository } = await import("./lib/repositories/approval.repository");

    // Check pending count before
    const before = await prisma.approval.findMany({
        where: { leaveId: 877, approverId: 5, decision: 'REJECTED' }
    });
    console.log("Rejected records before update:", before.length);

    if (before.length > 0) {
        console.log("Attempting direct Prisma update...");
        // Simulate what repository does
        const result = await prisma.approval.updateMany({
            where: {
                leaveId: 877,
                approverId: 5,
                decision: 'REJECTED'
            },
            data: {
                decision: 'PENDING',
                comment: null,
                decidedAt: null
            }
        });
        console.log("UpdateMany Result Count:", result.count);
    }


    const approvals = await prisma.approval.findMany({
        where: { leaveId: 877 },
        include: {
            approver: true,
            leave: {
                include: {
                    requester: true
                }
            }
        },
        orderBy: { step: 'asc' }
    });

    console.log("Recent Approvals:");
    for (const a of approvals) {
        console.log(`ID: ${a.id}, LeaveID: ${a.leaveId}, ApproverID: ${a.approverId} (${a.approver.name}), Decision: ${a.decision}, Step: ${a.step}, Requester Role: ${a.leave.requester.role}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
