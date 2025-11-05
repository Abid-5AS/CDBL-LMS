export type AppRole =
  | "EMPLOYEE"
  | "DEPT_HEAD"
  | "HR_ADMIN"
  | "HR_HEAD"
  | "CEO"
  | "SYSTEM_ADMIN";

export function canViewAllRequests(role: AppRole) {
  return (
    role === "HR_ADMIN" ||
    role === "HR_HEAD" ||
    role === "CEO" ||
    role === "DEPT_HEAD" ||
    role === "SYSTEM_ADMIN"
  );
}

export function canApprove(role: AppRole) {
  return (
    role === "HR_ADMIN" ||
    role === "HR_HEAD" ||
    role === "CEO" ||
    role === "DEPT_HEAD" ||
    role === "SYSTEM_ADMIN"
  );
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
  // SYSTEM_ADMIN can view everyone
  if (viewerRole === "SYSTEM_ADMIN") return true;

  // CEO can view everyone
  if (viewerRole === "CEO") return true;

  // HR_HEAD can view everyone except CEO
  if (viewerRole === "HR_HEAD") {
    return targetRole !== "CEO";
  }

  // HR_ADMIN can only view EMPLOYEE and DEPT_HEAD
  if (viewerRole === "HR_ADMIN") {
    return targetRole === "EMPLOYEE" || targetRole === "DEPT_HEAD";
  }

  // DEPT_HEAD can view their team members
  if (viewerRole === "DEPT_HEAD") {
    return targetRole === "EMPLOYEE";
  }

  // EMPLOYEE can view their own profile
  return viewerRole === targetRole;
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
  // SYSTEM_ADMIN can edit everyone
  if (viewerRole === "SYSTEM_ADMIN") return true;

  // CEO can edit everyone
  if (viewerRole === "CEO") return true;

  // HR_HEAD can edit HR_ADMIN, EMPLOYEE, and DEPT_HEAD
  if (viewerRole === "HR_HEAD") {
    return targetRole !== "CEO" && targetRole !== "HR_HEAD";
  }

  // HR_ADMIN can only edit EMPLOYEE and DEPT_HEAD
  if (viewerRole === "HR_ADMIN") {
    return targetRole === "EMPLOYEE" || targetRole === "DEPT_HEAD";
  }

  // DEPT_HEAD and EMPLOYEE cannot edit other users
  return false;
}

/**
 * Get the list of roles visible to a given role for employee management
 * @param role - The viewer's role
 * @returns Array of roles the viewer can see
 */
export function getVisibleRoles(role: AppRole): AppRole[] {
  switch (role) {
    case "SYSTEM_ADMIN":
      return [
        "EMPLOYEE",
        "DEPT_HEAD",
        "HR_ADMIN",
        "HR_HEAD",
        "CEO",
        "SYSTEM_ADMIN",
      ];
    case "CEO":
      return ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"];
    case "HR_HEAD":
      return ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD"];
    case "HR_ADMIN":
      return ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"];
    case "DEPT_HEAD":
      return ["EMPLOYEE"];
    default:
      return [];
  }
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
  // SYSTEM_ADMIN can assign any role
  if (viewerRole === "SYSTEM_ADMIN") return true;

  // CEO can assign any role
  if (viewerRole === "CEO") return true;

  // HR_HEAD can assign EMPLOYEE, DEPT_HEAD, HR_ADMIN
  if (viewerRole === "HR_HEAD") {
    return ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN"].includes(targetRole);
  }

  // HR_ADMIN can only assign EMPLOYEE and DEPT_HEAD
  if (viewerRole === "HR_ADMIN") {
    return ["EMPLOYEE", "DEPT_HEAD"].includes(targetRole);
  }

  // Others cannot assign roles
  return false;
}

/**
 * Check if a role can create new employees
 * @param role - The role of the person trying to create
 */
export function canCreateEmployee(role: AppRole): boolean {
  return (
    role === "HR_ADMIN" ||
    role === "HR_HEAD" ||
    role === "CEO" ||
    role === "SYSTEM_ADMIN"
  );
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
  // Admin roles can cancel any leave
  if (
    role === "HR_ADMIN" ||
    role === "HR_HEAD" ||
    role === "CEO" ||
    role === "SYSTEM_ADMIN"
  ) {
    return true;
  }
  // Employees can only cancel their own leave (triggers CANCELLATION_REQUESTED)
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
  // Only approvers can return requests for modification
  return (
    role === "HR_ADMIN" ||
    role === "HR_HEAD" ||
    role === "CEO" ||
    role === "DEPT_HEAD" ||
    role === "SYSTEM_ADMIN"
  );
}

/**
 * Check if a role can manage system structure (departments, users, hierarchies)
 * Only SYSTEM_ADMIN can manage system structure
 */
export function canManageSystemStructure(role: AppRole): boolean {
  return role === "SYSTEM_ADMIN";
}
