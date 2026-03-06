import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const updateProfileSchema = z.object({
    section: z.enum(["personal", "emergency", "banking"]),
    data: z.any(),
});

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                profile: true,
                emergencyContacts: true,
                bankDetails: true,
                documents: true,
            },
        });

        return NextResponse.json(userData);
    } catch (error) {
        console.error("[API] Error fetching user profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validation = updateProfileSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: validation.error },
                { status: 400 }
            );
        }

        const { section, data } = validation.data;

        if (section === "personal") {
            // Update or create profile
            await prisma.userProfile.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    ...data,
                    dob: data.dob ? new Date(data.dob) : undefined,
                },
                update: {
                    ...data,
                    dob: data.dob ? new Date(data.dob) : undefined,
                },
            });
        } else if (section === "emergency") {
            // For simplicity, we'll replace all contacts or add one. 
            // Let's assume 'data' is a single contact to add/update for now, 
            // or we can handle bulk updates. 
            // For this implementation, let's assume 'data' is the full list to replace? 
            // No, safer to handle individual add/update.
            // Let's assume data has 'id' for update, or no id for create.

            if (Array.isArray(data)) {
                // Replace all logic or bulk update? 
                // Let's keep it simple: if array, delete all and create new (full sync)
                await prisma.emergencyContact.deleteMany({ where: { userId: user.id } });
                await prisma.emergencyContact.createMany({
                    data: data.map((c: any) => ({ ...c, userId: user.id })),
                });
            } else {
                // Single update/create
                if (data.id) {
                    await prisma.emergencyContact.update({
                        where: { id: data.id },
                        data: { ...data, userId: undefined, id: undefined },
                    });
                } else {
                    await prisma.emergencyContact.create({
                        data: { ...data, userId: user.id },
                    });
                }
            }
        } else if (section === "banking") {
            // Update or create bank details
            await prisma.bankDetails.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    ...data,
                },
                update: {
                    ...data,
                },
            });
        } else if (section === "documents") {
            // Handle document operations (add/delete)
            if (data.operation === "add") {
                await prisma.userDocument.create({
                    data: {
                        userId: user.id,
                        title: data.title,
                        type: data.type,
                        fileUrl: data.fileUrl,
                    },
                });
            } else if (data.operation === "delete") {
                await prisma.userDocument.delete({
                    where: { id: data.id },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API] Error updating user profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

export const dynamic = "force-dynamic";
