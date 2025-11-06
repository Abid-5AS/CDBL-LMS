/**
 * Breadcrumb utility for generating navigation breadcrumbs from pathname
 */

export type BreadcrumbItem = {
  label: string;
  href: string;
};

/**
 * Maps route segments to human-readable labels
 */
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  employee: "Employee",
  "hr-admin": "HR Admin",
  "dept-head": "Department Head",
  "hr-head": "HR Head",
  ceo: "Executive",
  admin: "Admin",
  leaves: "Leaves",
  apply: "Apply",
  my: "My Requests",
  approvals: "Approvals",
  policies: "Policies",
  holidays: "Holidays",
  employees: "Employees",
  reports: "Reports",
  settings: "Settings",
  balance: "Leave Balance",
  audit: "Audit",
  manager: "Manager",
  login: "Login",
};

/**
 * Generate breadcrumbs from pathname
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Remove leading slash and split into segments
  const segments = pathname.split("/").filter(Boolean);
  
  // If at root, return just Dashboard
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  // Special handling for dashboard routes - return clean breadcrumbs
  if (pathname === "/dashboard/employee" || pathname.startsWith("/dashboard/employee")) {
    return [{ label: "Employee Dashboard", href: "/dashboard/employee" }];
  }
  if (pathname === "/dashboard/hr-admin" || pathname.startsWith("/dashboard/hr-admin")) {
    return [{ label: "HR Department Dashboard", href: "/dashboard/hr-admin" }];
  }
  if (pathname === "/dashboard/dept-head" || pathname.startsWith("/dashboard/dept-head")) {
    return [{ label: "Department Head Dashboard", href: "/dashboard/dept-head" }];
  }
  if (pathname === "/dashboard/hr-head" || pathname.startsWith("/dashboard/hr-head")) {
    return [{ label: "HR Head Dashboard", href: "/dashboard/hr-head" }];
  }
  if (pathname === "/dashboard/ceo" || pathname.startsWith("/dashboard/ceo")) {
    return [{ label: "Executive Dashboard", href: "/dashboard/ceo" }];
  }
  if (pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin")) {
    return [{ label: "Admin Console", href: "/dashboard/admin" }];
  }
  // Legacy route handling
  if (pathname === "/manager/dashboard" || pathname.startsWith("/manager/dashboard")) {
    return [
      { label: "Home", href: "/dashboard" },
      { label: "Department Head", href: "/dashboard/dept-head" },
    ];
  }

  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Always start with Dashboard (or Home for cleaner naming)
  breadcrumbs.push({ label: "Home", href: "/dashboard" });

  // Build breadcrumbs from segments
  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip if this would create a duplicate (e.g., /dashboard/dashboard)
    if (currentPath === "/dashboard" && breadcrumbs[0]?.href === "/dashboard") {
      continue;
    }

    // Get label from mapping or capitalize segment
    const label = routeLabels[segment.toLowerCase()] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return breadcrumbs;
}

