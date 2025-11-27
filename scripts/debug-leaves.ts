
import { PrismaClient } from "@prisma/client";
import { LeaveRepository } from "../lib/repositories/leave.repository";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching first user...");
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error("No users found in database.");
            return;
        }
        console.log(`Found user: ${user.email} (${user.id})`);

        console.log("Testing LeaveRepository.findByUserId...");
        const leaves = await LeaveRepository.findByUserId(user.id);
        console.log(`Successfully fetched ${leaves.length} leaves.`);
        console.log(JSON.stringify(leaves, null, 2));

    } catch (error) {
        console.error("Error in debug script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
