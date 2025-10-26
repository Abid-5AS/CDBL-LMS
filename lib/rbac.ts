export type AppRole = "EMPLOYEE" | "HR_ADMIN";

export function canViewAllRequests(role: AppRole) {
  return role === "HR_ADMIN";
}

export function canApprove(role: AppRole) {
  return role === "HR_ADMIN";
}
