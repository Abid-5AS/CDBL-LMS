export type AppRole =
  | "EMPLOYEE"
  | "DEPT_HEAD"
  | "HR_ADMIN"
  | "HR_HEAD"
  | "CEO"
  | "SYSTEM_ADMIN";

const VIEW_ALL_REQUESTS = new Set<AppRole>(["HR_ADMIN", "HR_HEAD", "CEO", "DEPT_HEAD", "SYSTEM_ADMIN"]);
const APPROVER_ROLES = new Set<AppRole>(["HR_HEAD", "CEO", "DEPT_HEAD", "SYSTEM_ADMIN"]);
const RETURN_ROLES = new Set<AppRole>(["HR_ADMIN", "HR_HEAD", "CEO", "DEPT_HEAD", "SYSTEM_ADMIN"]);
const ADMIN_CANCEL_ROLES = new Set<AppRole>(["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"]);
const SYSTEM_ONLY = new Set<AppRole>(["SYSTEM_ADMIN"]);

const PROFILE_VIEW_MATRIX: Record<AppRole, Set<AppRole>> = {
  SYSTEM_ADMIN: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"]),
  CEO: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"]),
  HR_HEAD: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD"]),
  HR_ADMIN: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"]),
  DEPT_HEAD: new Set(["EMPLOYEE", "DEPT_HEAD"]),
  EMPLOYEE: new Set(["EMPLOYEE"]),
};

const PROFILE_EDIT_MATRIX: Record<AppRole, Set<AppRole>> = {
  SYSTEM_ADMIN: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"]),
  CEO: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"]),
  HR_HEAD: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"]),
  HR_ADMIN: new Set(),
  DEPT_HEAD: new Set(),
  EMPLOYEE: new Set(),
};

const ASSIGNABLE_ROLES: Record<AppRole, Set<AppRole>> = {
  SYSTEM_ADMIN: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"]),
  CEO: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"]),
  HR_HEAD: new Set(["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"]),
  HR_ADMIN: new Set(),
  DEPT_HEAD: new Set(),
  EMPLOYEE: new Set(),
};

const VISIBLE_ROLES: Record<AppRole, AppRole[]> = {
  SYSTEM_ADMIN: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"],
  CEO: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"],
  HR_HEAD: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD"],
  HR_ADMIN: ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"],
  DEPT_HEAD: ["EMPLOYEE"],
  EMPLOYEE: [],
};

export function canViewAllRequests(role: AppRole) {
  return VIEW_ALL_REQUESTS.has(role);
}

export function canApprove(role: AppRole) {
  return APPROVER_ROLES.has(role);
}

/**
 * Check if a viewer role can view a target user's profile
 * @param viewerRole - The role of the person trying to view
 * @param targetRole - The role of the person being viewed
 */
export function canViewEmployee(
  viewerRole: AppRole,
  targetRole: AppRole
): boolean {
  const allowed = PROFILE_VIEW_MATRIX[viewerRole] ?? new Set<AppRole>();
  return allowed.has(targetRole);
}

/**
 * Check if a viewer role can edit a target user's profile
 * @param viewerRole - The role of the person trying to edit
 * @param targetRole - The role of the person being edited
 */
export function canEditEmployee(
  viewerRole: AppRole,
  targetRole: AppRole
): boolean {
  const allowed = PROFILE_EDIT_MATRIX[viewerRole] ?? new Set<AppRole>();
  return allowed.has(targetRole);
}

/**
 * Get the list of roles visible to a given role for employee management
 * @param role - The viewer's role
 * @returns Array of roles the viewer can see
 */
export function getVisibleRoles(role: AppRole): AppRole[] {
  return VISIBLE_ROLES[role] ?? [];
}

/**
 * Check if a viewer role can assign a target role to an employee
 * @param viewerRole - The role of the person trying to assign
 * @param targetRole - The role being assigned
 */
export function canAssignRole(
  viewerRole: AppRole,
  targetRole: AppRole
): boolean {
  const allowed = ASSIGNABLE_ROLES[viewerRole] ?? new Set<AppRole>();
  return allowed.has(targetRole);
}

/**
 * Check if a role can create new employees
 * @param role - The role of the person trying to create
 */
export function canCreateEmployee(role: AppRole): boolean {
  return SYSTEM_ONLY.has(role);
}

/**
 * Check if a role can cancel leave requests
 * Rules:
 * - HR_ADMIN, HR_HEAD, CEO can cancel any approved leave (admin override)
 * - EMPLOYEE can initiate cancellation request for their own approved leave
 * @param role - The role of the person trying to cancel
 * @param isOwnLeave - Whether the leave belongs to the actor
 */
export function canCancel(role: AppRole, isOwnLeave: boolean = false): boolean {
  if (ADMIN_CANCEL_ROLES.has(role)) return true;
  return isOwnLeave && role === "EMPLOYEE";
}

/**
 * Check if a role can return a leave request for modification
 * Rules:
 * - Only approvers (HR_ADMIN, HR_HEAD, CEO, DEPT_HEAD) can return requests
 * - Used to set status to RETURNED so employee can modify and resubmit
 * @param role - The role of the person trying to return
 */
export function canReturn(role: AppRole): boolean {
  return RETURN_ROLES.has(role);
}

/**
 * Check if a role can manage system structure (departments, users, hierarchies)
 * Only SYSTEM_ADMIN can manage system structure
 */
export function canManageSystemStructure(role: AppRole): boolean {
  return SYSTEM_ONLY.has(role);
}

/**
 * Check if a role can manage leave policies
 * Only SYSTEM_ADMIN can manage policies
 */
export function canManagePolicy(role: AppRole): boolean {
  return SYSTEM_ONLY.has(role);
}

/**
 * Check if a role can manage holidays
 * Only SYSTEM_ADMIN can manage holidays
 */
export function canManageHolidays(role: AppRole): boolean {
  return SYSTEM_ONLY.has(role);
}

/**
 * Check if a role can view audit logs
 * Only SYSTEM_ADMIN can view audit logs
 */
export function canViewAudit(role: AppRole): boolean {
  return SYSTEM_ONLY.has(role);
}

/**
 * Check if a role can approve fitness certificates
 * Only HR_ADMIN, HR_HEAD, and CEO can approve fitness certificates
 * These roles follow a chain: HR_ADMIN → HR_HEAD → CEO
 */
export function canApproveFitnessCertificate(role: AppRole): boolean {
  const FITNESS_CERT_APPROVERS = new Set<AppRole>(["HR_ADMIN", "HR_HEAD", "CEO"]);
  return FITNESS_CERT_APPROVERS.has(role);
}

/**
 * Check if a role can reject fitness certificates
 * Same roles that can approve can also reject
 */
export function canRejectFitnessCertificate(role: AppRole): boolean {
  return canApproveFitnessCertificate(role);
}
