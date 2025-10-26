export type AppRole = "EMPLOYEE" | "HR_ADMIN" | "SUPER_ADMIN";

export function canViewAllRequests(role: AppRole) {
  return role === "HR_ADMIN" || role === "SUPER_ADMIN";
}

export function canApprove(role: AppRole) {
  return role === "HR_ADMIN" || role === "SUPER_ADMIN";
}
