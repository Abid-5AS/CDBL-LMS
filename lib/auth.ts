import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function getCurrentUser() {
  const store = await cookies();
  const emailCookie = store.get("auth_user_email")?.value?.trim();
  const idCookie = store.get("auth_user_id")?.value;
  const idNumber = idCookie ? Number(idCookie) : undefined;

  if (!emailCookie && (idNumber === undefined || Number.isNaN(idNumber))) {
    return null;
  }

  const orClauses: Prisma.UserWhereInput[] = [];
  if (emailCookie) {
    orClauses.push({ email: { equals: emailCookie } });
  }
  if (idNumber !== undefined && !Number.isNaN(idNumber)) {
    orClauses.push({ id: idNumber });
  }

  const user = orClauses.length
    ? await prisma.user.findFirst({ where: { OR: orClauses } })
    : null;

  return user;
}
