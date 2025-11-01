import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const cache = "no-store";

const HolidaySchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  isOptional: z.boolean().optional().default(false),
});

// GET - List holidays (public for employees, full for admins)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where = upcoming
    ? {
        date: {
          gte: today,
        },
      }
    : {};

  const holidays = await prisma.holiday.findMany({
    where,
    orderBy: {
      date: "asc",
    },
  });

  return NextResponse.json({
    items: holidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: h.date.toISOString(),
      isOptional: h.isOptional,
    })),
  });
}

// POST - Create holiday (admin only)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "HR_ADMIN" && user.role !== "HR_HEAD" && user.role !== "CEO")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = HolidaySchema.parse(body);
    const date = new Date(parsed.date);

    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }

    // Check for duplicate date
    const existing = await prisma.holiday.findUnique({
      where: { date },
    });

    if (existing) {
      return NextResponse.json({ error: "duplicate_date" }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name: parsed.name,
        date,
        isOptional: parsed.isOptional ?? false,
      },
    });

    return NextResponse.json({
      ok: true,
      item: {
        id: holiday.id,
        name: holiday.name,
        date: holiday.date.toISOString(),
        isOptional: holiday.isOptional,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_input", details: error.issues }, { status: 400 });
    }
    console.error("Holiday creation error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

