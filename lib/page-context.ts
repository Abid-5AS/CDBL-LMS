import type { LucideIcon } from "lucide-react";
import {
  PlaneTakeoff,
  ClipboardList,
  ClipboardCheck,
  Users,
  FileText,
  BarChart2,
  Settings,
  Filter,
  Download,
  X,
  Check,
  XCircle,
  MessageSquare,
  Calendar,
  UserPlus,
  PlusCircle,
  Eye,
  Bookmark,
  LayoutDashboard,
  ArrowLeft,
} from "lucide-react";
import type { AppRole } from "./rbac";
import { toast } from "sonner";
import { getToastMessage } from "./toast-messages";

export type PageContext =
  | "dashboard"
  | "requests"
  | "apply"
  | "approvals"
  | "employees"
  | "reports"
  | "settings"
  | "default";

export type ActionConfig = {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: number;
  requiresSelection?: boolean;
  priority: "primary" | "secondary" | "tertiary";
};

/**
 * Infer page context from pathname
 */
export function inferPageContext(pathname: string): PageContext {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname === "/leaves/apply" || pathname.startsWith("/leaves/apply/")) return "apply";
  if (pathname.startsWith("/leaves")) return "requests";
  if (pathname.startsWith("/approvals")) return "approvals";
  if (pathname.startsWith("/employees")) return "employees";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/settings")) return "settings";
  return "default";
}

/**
 * Helper functions for dock actions
 */
async function exportCsv(searchParams: URLSearchParams) {
  try {
    const qs = new URLSearchParams(searchParams.toString());
    const res = await fetch(`/api/leaves/export?${qs.toString()}`, { method: "GET" });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(getToastMessage(err.error ?? "unknown_error"));
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leaves-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("CSV exported successfully");
  } catch (error) {
    toast.error("Failed to export CSV");
    console.error("Export error:", error);
  }
}

function saveView(pathname: string, searchParams: URLSearchParams, role: AppRole) {
  // Persist current path + query as a saved view for this user
  const view = { path: pathname, query: Object.fromEntries(searchParams.entries()) };
  localStorage.setItem(`lms:view:${role}:${pathname}`, JSON.stringify(view));
  toast.success("View saved successfully");
}

function openFilterModal() {
  // Try to find FilterBar first
  const filterBar = document.querySelector('[data-filter-bar]');
  if (filterBar) {
    filterBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Add a temporary highlight class
    filterBar.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-lg', 'transition-all');
    setTimeout(() => {
      filterBar.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
    }, 2000);
    // Focus on search input if available
    const searchInput = filterBar.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 300);
    }
    toast.success("Scrolled to filter bar");
    return;
  }
  
  // Try to find FilterChips (status tabs)
  const filterChips = document.querySelector('[data-filter-chips], button[aria-selected], [role="tablist"]');
  if (filterChips) {
    filterChips.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Highlight the container
    const container = filterChips.closest('div, section, card');
    if (container) {
      container.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'rounded-lg', 'transition-all');
      setTimeout(() => {
        container.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
    toast.success("Scrolled to filter options");
    return;
  }
  
  // Fallback: scroll to any filter-like element
  const anyFilter = document.querySelector('input[type="search"], select[aria-label*="filter" i], select[aria-label*="status" i], select[aria-label*="type" i]');
  if (anyFilter) {
    anyFilter.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (anyFilter as HTMLElement).focus();
    toast.success("Scrolled to filters");
    return;
  }
  
  toast.info("Filter options are already visible. Use the filters above to narrow down results.");
}

/**
 * Get actions for a specific page context, role, and selection state
 */
export function getActionsForContext(
  role: AppRole,
  pageContext: PageContext,
  selectionCount: number,
  pathname?: string,
  searchParams?: URLSearchParams
): ActionConfig[] {
  const actions: ActionConfig[] = [];

  switch (pageContext) {
    case "dashboard":
      if (role === "EMPLOYEE") {
        actions.push(
          {
            label: "Apply Leave",
            icon: PlaneTakeoff,
            href: "/leaves/apply",
            priority: "primary",
          },
          {
            label: "Leave Requests",
            icon: ClipboardList,
            href: "/leaves",
            priority: "secondary",
          },
          {
            label: "Control Center",
            icon: Settings,
            onClick: () => {
              // This will be handled by the ControlCenter component
              // Triggered via keyboard shortcut or click
              const event = new KeyboardEvent("keydown", {
                key: ",",
                ctrlKey: true,
                bubbles: true,
              });
              window.dispatchEvent(event);
            },
            priority: "tertiary",
          }
        );
      } else if (role === "DEPT_HEAD") {
        actions.push(
          {
            label: "Team Requests",
            icon: ClipboardCheck,
            href: "/approvals",
            priority: "primary",
          },
          {
            label: "Team Calendar",
            icon: Calendar,
            href: "/holidays",
            priority: "secondary",
          }
        );
      } else if (role === "HR_ADMIN" || role === "HR_HEAD") {
        actions.push(
          {
            label: "Approvals",
            icon: ClipboardCheck,
            href: "/approvals",
            priority: "primary",
          },
          {
            label: "Employees",
            icon: Users,
            href: "/employees",
            priority: "secondary",
          },
          {
            label: "Audit Logs",
            icon: FileText,
            href: "/admin/audit",
            priority: "tertiary",
          }
        );
      } else if (role === "CEO") {
        actions.push(
          {
            label: "Insights",
            icon: BarChart2,
            href: "/dashboard",
            priority: "primary",
          },
          {
            label: "Reports",
            icon: FileText,
            href: "/reports",
            priority: "secondary",
          }
        );
      }
      break;

    case "apply":
      // Contextual actions for apply leave form page
      actions.push(
        {
          label: "Cancel Application",
          icon: ArrowLeft,
          onClick: () => {
            if (typeof window !== "undefined") {
              window.history.back();
            }
          },
          priority: "primary",
        },
        {
          label: "View Leave Requests",
          icon: ClipboardList,
          href: "/leaves",
          priority: "secondary",
        },
        {
          label: "Go to Dashboard",
          icon: LayoutDashboard,
          href: "/dashboard",
          priority: "tertiary",
        }
      );
      break;

    case "requests":
      // Role-aware actions for leave requests page
      if (role === "EMPLOYEE") {
        // Employees get navigation actions, not admin tools
        if (selectionCount > 0) {
          actions.push(
            {
              label: `Cancel Selected (${selectionCount})`,
              icon: X,
              onClick: () => {
                // Bulk cancel will be handled by selection context
                const event = new CustomEvent("lms:bulkCancel", { detail: { count: selectionCount } });
                window.dispatchEvent(event);
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "primary",
            }
          );
        } else {
          // No selection: show navigation actions
          actions.push(
            {
              label: "Apply Leave",
              icon: PlaneTakeoff,
              href: "/leaves/apply",
              priority: "primary",
            },
            {
              label: "My Requests",
              icon: ClipboardList,
              href: "/leaves",
              priority: "secondary",
            },
            {
              label: "Dashboard",
              icon: LayoutDashboard,
              href: "/dashboard",
              priority: "tertiary",
            }
          );
        }
      } else if (role === "DEPT_HEAD" || role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO") {
        // HR/Admin roles get approval-focused actions
        if (selectionCount > 0) {
          actions.push(
            {
              label: `Approve Selected (${selectionCount})`,
              icon: Check,
              onClick: () => {
                const event = new CustomEvent("lms:bulkApprove", { detail: { count: selectionCount } });
                window.dispatchEvent(event);
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "primary",
            },
            {
              label: `Return for Modification (${selectionCount})`,
              icon: XCircle,
              onClick: () => {
                const event = new CustomEvent("lms:bulkReturn", { detail: { count: selectionCount } });
                window.dispatchEvent(event);
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "secondary",
            }
          );
        } else {
          // Admin tools for HR roles when no selection
          const currentPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
          const currentSearch = searchParams || (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams());
          
          actions.push(
            {
              label: "Review Requests",
              icon: ClipboardCheck,
              href: "/approvals",
              priority: "primary",
            },
            {
              label: "Export CSV",
              icon: Download,
              onClick: () => {
                if (typeof window !== "undefined") {
                  exportCsv(currentSearch);
                }
              },
              priority: "secondary",
            },
            {
              label: "Reports",
              icon: BarChart2,
              href: "/reports",
              priority: "tertiary",
            }
          );
        }
      }
      break;

    case "approvals":
      if (role === "DEPT_HEAD" || role === "HR_ADMIN" || role === "HR_HEAD" || role === "CEO") {
        if (selectionCount > 0) {
          actions.push(
            {
              label: `Approve Selected (${selectionCount})`,
              icon: Check,
              onClick: () => {
                const event = new CustomEvent("lms:bulkApprove", { detail: { count: selectionCount } });
                window.dispatchEvent(event);
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "primary",
            },
            {
              label: `Reject Selected (${selectionCount})`,
              icon: XCircle,
              onClick: () => {
                const event = new CustomEvent("lms:bulkReject", { detail: { count: selectionCount } });
                window.dispatchEvent(event);
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "secondary",
            },
            {
              label: `Return for Modification (${selectionCount})`,
              icon: MessageSquare,
              onClick: () => {
                const event = new CustomEvent("lms:bulkReturn", { detail: { count: selectionCount } });
                window.dispatchEvent(event);
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "tertiary",
            }
          );
        } else {
          // Admin tools for approval pages
          const currentSearch = searchParams || (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams());
          
          actions.push(
            {
              label: "Approval Queue",
              icon: ClipboardCheck,
              href: "/approvals",
              priority: "primary",
            },
            {
              label: "Export CSV",
              icon: Download,
              onClick: () => {
                if (typeof window !== "undefined") {
                  exportCsv(currentSearch);
                }
              },
              priority: "secondary",
            },
            {
              label: "Dashboard",
              icon: LayoutDashboard,
              href: "/dashboard",
              priority: "tertiary",
            }
          );
        }
      }
      break;

    case "employees":
      if (role === "HR_ADMIN" || role === "HR_HEAD") {
        actions.push(
          {
            label: "Add Employee",
            icon: UserPlus,
            href: "/admin/users/create",
            priority: "primary",
          },
          {
            label: "Employees",
            icon: Users,
            href: "/employees",
            priority: "secondary",
          }
        );
      }
      break;

    case "default":
    default:
      // Fallback to role-based actions
      if (role === "EMPLOYEE") {
        actions.push(
          {
            label: "Apply Leave",
            icon: PlaneTakeoff,
            href: "/leaves/apply",
            priority: "primary",
          },
          {
            label: "Leave Requests",
            icon: ClipboardList,
            href: "/leaves",
            priority: "secondary",
          }
        );
      } else if (role === "DEPT_HEAD") {
        actions.push(
          {
            label: "Team Requests",
            icon: ClipboardCheck,
            href: "/approvals",
            priority: "primary",
          },
          {
            label: "Team Calendar",
            icon: Calendar,
            href: "/holidays",
            priority: "secondary",
          }
        );
      } else if (role === "HR_ADMIN" || role === "HR_HEAD") {
        actions.push(
          {
            label: "Approvals",
            icon: ClipboardCheck,
            href: "/approvals",
            priority: "primary",
          },
          {
            label: "Employees",
            icon: Users,
            href: "/employees",
            priority: "secondary",
          },
          {
            label: "Audit Logs",
            icon: FileText,
            href: "/admin/audit",
            priority: "tertiary",
          }
        );
      } else if (role === "CEO") {
        actions.push(
          {
            label: "Insights",
            icon: BarChart2,
            href: "/dashboard",
            priority: "primary",
          },
          {
            label: "Reports",
            icon: FileText,
            href: "/reports",
            priority: "secondary",
          }
        );
      }
      break;
  }

  // Filter out actions that require selection but have none
  const filteredActions = actions.filter(
    (action) => !action.requiresSelection || selectionCount > 0
  );

  // Sort by priority and limit to 3
  const sortedActions = filteredActions
    .sort((a, b) => {
      const priorityOrder = { primary: 0, secondary: 1, tertiary: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3);

  return sortedActions;
}

