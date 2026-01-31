
async function main() {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    try {
        console.log("Attempting to connect to database...");
        await prisma.$connect();
        console.log("Successfully connected!");
        const userCount = await prisma.user.count();
        console.log(`User count: ${userCount}`);
    } catch (error) {
        console.error("Prisma diagnostic failed:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
