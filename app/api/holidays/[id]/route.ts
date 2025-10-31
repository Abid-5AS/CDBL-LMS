import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const cache = "no-store";

const UpdateHolidaySchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().optional(),
  isOptional: z.boolean().optional(),
});

// PATCH - Update holiday (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "HR_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const holidayId = Number(id);
    if (isNaN(holidayId)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateHolidaySchema.parse(body);

    const updateData: {
      name?: string;
      date?: Date;
      isOptional?: boolean;
    } = {};

    if (parsed.name !== undefined) {
      updateData.name = parsed.name;
    }
    if (parsed.date !== undefined) {
      const date = new Date(parsed.date);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "invalid_date" }, { status: 400 });
      }
      updateData.date = date;
    }
    if (parsed.isOptional !== undefined) {
      updateData.isOptional = parsed.isOptional;
    }

    const holiday = await prisma.holiday.update({
      where: { id: holidayId },
      data: updateData,
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
    console.error("Holiday update error:", error);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

// DELETE - Delete holiday (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "HR_ADMIN" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const holidayId = Number(id);
    if (isNaN(holidayId)) {
      return NextResponse.json({ error: "invalid_id" }, { status: 400 });
    }

    await prisma.holiday.delete({
      where: { id: holidayId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Holiday deletion error:", error);
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

