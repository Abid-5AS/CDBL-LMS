"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const HolidaySchema = z.object({
  name: z.string().min(1),
  date: z.string(),
  isOptional: z.boolean().optional().default(false),
});

export async function createHoliday(holidayData: {
  name: string;
  date: string; // ISO string
  isOptional?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user || !["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const parsed = HolidaySchema.parse(holidayData);
    const date = new Date(parsed.date);

    if (isNaN(date.getTime())) {
      return { success: false, error: "Invalid date" };
    }

    // Check for duplicate date
    const existing = await prisma.holiday.findUnique({
      where: { date },
    });

    if (existing) {
      return { success: false, error: "Holiday already exists for this date" };
    }

    const holiday = await prisma.holiday.create({
      data: {
        name: parsed.name,
        date,
        isOptional: parsed.isOptional ?? false,
      },
    });

    // Automatic cache invalidation
    revalidatePath("/holidays");
    revalidatePath("/admin/holidays");
    revalidatePath("/api/holidays");

    return {
      success: true,
      data: {
        id: holiday.id,
        name: holiday.name,
        date: holiday.date.toISOString(),
        isOptional: holiday.isOptional,
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "Invalid input",
        details: error.issues 
      };
    }
    console.error("createHoliday error:", error);
    return { success: false, error: "Failed to create holiday" };
  }
}

export async function updateHoliday(holidayId: number, updates: {
  name?: string;
  date?: string; // ISO string
  isOptional?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user || !["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updateData: any = {};
    if (updates.name) {
      updateData.name = updates.name;
    }
    if (updates.date) {
      const date = new Date(updates.date);
      if (isNaN(date.getTime())) {
        return { success: false, error: "Invalid date" };
      }
      updateData.date = date;
    }
    if (updates.isOptional !== undefined) {
      updateData.isOptional = updates.isOptional;
    }

    const holiday = await prisma.holiday.update({
      where: { id: holidayId },
      data: updateData,
    });

    // Automatic cache invalidation
    revalidatePath("/holidays");
    revalidatePath("/admin/holidays");
    revalidatePath(`/api/holidays/${holidayId}`);

    return {
      success: true,
      data: {
        id: holiday.id,
        name: holiday.name,
        date: holiday.date.toISOString(),
        isOptional: holiday.isOptional,
      }
    };
  } catch (error) {
    console.error("updateHoliday error:", error);
    return { success: false, error: "Failed to update holiday" };
  }
}

export async function deleteHoliday(holidayId: number) {
  const user = await getCurrentUser();
  if (!user || !["HR_ADMIN", "HR_HEAD", "CEO"].includes(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.holiday.delete({
      where: { id: holidayId },
    });

    // Automatic cache invalidation
    revalidatePath("/holidays");
    revalidatePath("/admin/holidays");

    return { success: true };
  } catch (error) {
    console.error("deleteHoliday error:", error);
    return { success: false, error: "Failed to delete holiday" };
  }
}

export async function getHolidays(upcomingOnly: boolean = false) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const where = upcomingOnly
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

  return {
    items: holidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: h.date.toISOString(),
      isOptional: h.isOptional,
    })),
  };
}