// prisma/seed-holidays-2026.ts
// Run with: npx tsx prisma/seed-holidays-2026.ts

import { prisma } from "../lib/prisma";

const holidays2026 = [
    // February
    { date: "2026-02-04", name: "Shab e-Barat (Night of Records)", isOptional: false },
    { date: "2026-02-12", name: "Public Holiday (13th Parliamentary Election and Constitutional Referendum)", isOptional: true },
    { date: "2026-02-21", name: "Shahid Dibosh (International Mother Language Day)", isOptional: false },

    // March - Eid ul-Fitr
    { date: "2026-03-17", name: "Shab-e-Qadar (Night of Destiny)", isOptional: false },
    { date: "2026-03-19", name: "Eid-ul-Fiter Holiday", isOptional: false },
    { date: "2026-03-20", name: "Jumatul Bidah", isOptional: false },
    { date: "2026-03-21", name: "Eid-ul-Fiter (End of Ramadan)", isOptional: false },
    { date: "2026-03-22", name: "Eid-ul-Fiter Holiday", isOptional: false },
    { date: "2026-03-23", name: "Eid-ul-Fiter Holiday", isOptional: false },
    { date: "2026-03-26", name: "Independence Day (National Day)", isOptional: false },

    // April
    { date: "2026-04-13", name: "Chaitra Sankranti (Rangamati, Khagrachhari and Bandarban Hill districts)", isOptional: true },
    { date: "2026-04-14", name: "Pahela Baishakh (Bangla New Year)", isOptional: false },

    // May - Eid ul-Azha
    { date: "2026-05-01", name: "May Day", isOptional: false },
    { date: "2026-05-01", name: "Buddha Purnima (Buddha Day)", isOptional: true },
    { date: "2026-05-26", name: "Eid-ul-Azha Holiday", isOptional: false },
    { date: "2026-05-27", name: "Eid-ul-Azha Holiday", isOptional: false },
    { date: "2026-05-28", name: "Eid-ul-Azha (Feast of Sacrifice)", isOptional: false },
    { date: "2026-05-29", name: "Eid-ul-Azha Holiday", isOptional: false },
    { date: "2026-05-30", name: "Eid-ul-Azha Holiday", isOptional: false },
    { date: "2026-05-31", name: "Eid-ul-Azha Holiday", isOptional: false },

    // June
    { date: "2026-06-26", name: "Ashura (Muharrum)", isOptional: false },

    // July
    { date: "2026-07-01", name: "July Bank Holiday", isOptional: true },

    // August
    { date: "2026-08-05", name: "July Mass Uprising Day", isOptional: false },
    { date: "2026-08-26", name: "Eid-e-Milad-un Nabi (The Prophet's Birthday)", isOptional: false },

    // September
    { date: "2026-09-04", name: "Sri Krishna Janamashtami", isOptional: false },

    // October
    { date: "2026-10-20", name: "Durga Puja Holiday", isOptional: false },
    { date: "2026-10-21", name: "Durga Puja (Bijoya Dashami)", isOptional: false },

    // December
    { date: "2026-12-16", name: "Bijoy Dibosh (Victory Day)", isOptional: false },
    { date: "2026-12-25", name: "Christmas Day", isOptional: false },
    { date: "2026-12-31", name: "New Year's Eve Bank Holiday", isOptional: true },
];

async function main() {
    console.log("🗓️  Seeding 2026 Bangladesh Public Holidays...");

    // Use upsert to avoid duplicates
    for (const holiday of holidays2026) {
        try {
            const result = await prisma.holiday.upsert({
                where: { date: new Date(holiday.date) },
                update: { name: holiday.name, isOptional: holiday.isOptional },
                create: {
                    date: new Date(holiday.date),
                    name: holiday.name,
                    isOptional: holiday.isOptional,
                },
            });
            console.log(`✅ ${holiday.date}: ${holiday.name}`);
        } catch (e: any) {
            // Handle duplicate dates (May 1 has two holidays)
            if (e.code === "P2002") {
                console.log(`⚠️  Skipping duplicate: ${holiday.date} - ${holiday.name}`);
            } else {
                throw e;
            }
        }
    }

    const count = await prisma.holiday.count({
        where: {
            date: {
                gte: new Date("2026-01-01"),
                lt: new Date("2027-01-01"),
            },
        },
    });

    console.log(`\n🎉 Done! Total 2026 holidays in database: ${count}`);
}

main()
    .catch((e) => {
        console.error("❌ Error seeding holidays:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
