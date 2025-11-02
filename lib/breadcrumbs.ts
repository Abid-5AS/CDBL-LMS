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
  admin: "Admin",
  audit: "Audit",
  manager: "Manager",
  "hr-head": "HR Head",
  ceo: "Executive",
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

  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Always start with Dashboard
  breadcrumbs.push({ label: "Dashboard", href: "/dashboard" });

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

