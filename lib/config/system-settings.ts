import { prisma } from "@/lib/prisma";

export async function getDailyProcessingTarget(): Promise<number> {
  // For now, we'll use an environment variable with a fallback.
  // In the future, this could be fetched from a SystemSettings table.
  const target = process.env.DAILY_PROCESSING_TARGET;
  return target ? parseInt(target, 10) : 10;
}
