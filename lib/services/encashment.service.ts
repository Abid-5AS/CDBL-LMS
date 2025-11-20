import { prisma } from "@/lib/prisma";
import { validateELEncashment } from "@/lib/policy";
import type { Prisma, User } from "@prisma/client";
import { z } from "zod";

export class EncashmentServiceError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const EncashmentRequestSchema = z.object({
  daysRequested: z.number().int().positive(),
  reason: z.string().optional(),
});

type EncashmentFilters = {
  status?: string | null;
};

export async function listEncashmentRequests(user: User, filters: EncashmentFilters) {
  const where: Prisma.EncashmentRequestWhereInput = {};

  if (user.role === "EMPLOYEE" || user.role === "DEPT_HEAD") {
    where.userId = user.id;
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status as Prisma.EnumEncashmentStatusFilter["equals"];
  }

  return prisma.encashmentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          empCode: true,
          department: true,
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

type CreateEncashmentRequestInput = z.infer<typeof EncashmentRequestSchema>;

export async function createEncashmentRequest(user: User, input: CreateEncashmentRequestInput) {
  const currentYear = new Date().getFullYear();

  const elBalance = await prisma.balance.findUnique({
    where: {
      userId_type_year: {
        userId: user.id,
        type: "EARNED",
        year: currentYear,
      },
    },
  });

  if (!elBalance) {
    throw new EncashmentServiceError(
      "no_el_balance",
      "You don't have an EL balance record for this year. Please contact HR.",
      404
    );
  }

  const currentBalance = (elBalance.opening ?? 0) + (elBalance.accrued ?? 0) - (elBalance.used ?? 0);
  const validation = validateELEncashment(currentBalance, input.daysRequested);

  if (!validation.valid) {
    throw new EncashmentServiceError(
      "encashment_validation_failed",
      validation.reason ?? "Encashment request failed validation.",
      400,
      {
        currentBalance,
        requested: input.daysRequested,
        maxEncashable: validation.maxEncashable,
      }
    );
  }

  const existingPending = await prisma.encashmentRequest.findFirst({
    where: {
      userId: user.id,
      year: currentYear,
      status: "PENDING",
    },
  });

  if (existingPending) {
    throw new EncashmentServiceError(
      "encashment_already_pending",
      "You already have a pending encashment request for this year. Please wait for it to be processed.",
      400,
      { existingRequestId: existingPending.id }
    );
  }

  const encashmentRequest = await prisma.encashmentRequest.create({
    data: {
      userId: user.id,
      year: currentYear,
      daysRequested: input.daysRequested,
      balanceAtRequest: currentBalance,
      reason: input.reason,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorEmail: user.email,
      action: "ENCASHMENT_REQUESTED",
      targetEmail: user.email,
      details: {
        encashmentId: encashmentRequest.id,
        year: currentYear,
        daysRequested: input.daysRequested,
        balanceAtRequest: currentBalance,
        remainingBalance: validation.remainingBalance,
      },
    },
  });

  return {
    request: encashmentRequest,
    remainingBalance: validation.remainingBalance,
  };
}
