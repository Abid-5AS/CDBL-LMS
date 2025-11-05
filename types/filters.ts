import type { LeaveType } from "@prisma/client";

export type Status = "ALL" | "PENDING" | "FORWARDED" | "RETURNED" | "CANCELLED";

export type FilterState = {
  q: string;
  status: Status;
  type: LeaveType | "ALL";
  page: number;
  pageSize: number;
};

export const DEFAULT_FILTER: FilterState = {
  q: "",
  status: "PENDING",
  type: "ALL",
  page: 1,
  pageSize: 10,
};

