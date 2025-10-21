export type Role = "employee" | "dept_head" | "hr_admin" | "hr_head" | "ceo" | "admin";

export function canViewAllRequests(role: Role) {
  return ["dept_head", "hr_admin", "hr_head", "ceo", "admin"].includes(role);
}

export function canApprove(role: Role) {
  return ["dept_head", "hr_admin", "hr_head", "ceo"].includes(role);
}
