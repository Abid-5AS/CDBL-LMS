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
} from "lucide-react";
import type { AppRole } from "./rbac";

export type PageContext =
  | "dashboard"
  | "requests"
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
  if (pathname.startsWith("/leaves")) return "requests";
  if (pathname.startsWith("/approvals")) return "approvals";
  if (pathname.startsWith("/employees")) return "employees";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/settings")) return "settings";
  return "default";
}

/**
 * Get actions for a specific page context, role, and selection state
 */
export function getActionsForContext(
  role: AppRole,
  pageContext: PageContext,
  selectionCount: number
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

    case "requests":
      if (selectionCount > 0) {
        actions.push(
          {
            label: `Cancel Selected (${selectionCount})`,
            icon: X,
            onClick: () => {
              // Bulk cancel action - will be handled by the table
              console.log("Bulk cancel", selectionCount, "items");
            },
            badge: selectionCount,
            requiresSelection: true,
            priority: "primary",
          },
          {
            label: `View Selected (${selectionCount})`,
            icon: Eye,
            onClick: () => {
              console.log("View selected", selectionCount, "items");
            },
            badge: selectionCount,
            requiresSelection: true,
            priority: "secondary",
          }
        );
      } else {
        actions.push(
          {
            label: "Save View",
            icon: Bookmark,
            onClick: () => {
              console.log("Save view");
            },
            priority: "primary",
          },
          {
            label: "New Filter",
            icon: Filter,
            onClick: () => {
              console.log("New filter");
            },
            priority: "secondary",
          },
          {
            label: "Export CSV",
            icon: Download,
            onClick: () => {
              console.log("Export CSV");
            },
            priority: "tertiary",
          }
        );
      }
      break;

    case "approvals":
      if (role === "DEPT_HEAD" || role === "HR_ADMIN" || role === "HR_HEAD") {
        if (selectionCount > 0) {
          actions.push(
            {
              label: `Approve Selected (${selectionCount})`,
              icon: Check,
              onClick: () => {
                console.log("Approve selected", selectionCount, "items");
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "primary",
            },
            {
              label: `Reject Selected (${selectionCount})`,
              icon: XCircle,
              onClick: () => {
                console.log("Reject selected", selectionCount, "items");
              },
              badge: selectionCount,
              requiresSelection: true,
              priority: "secondary",
            },
            {
              label: "Nudge Approver",
              icon: MessageSquare,
              onClick: () => {
                console.log("Nudge approver");
              },
              requiresSelection: true,
              priority: "tertiary",
            }
          );
        } else {
          actions.push(
            {
              label: "Save View",
              icon: Bookmark,
              onClick: () => {
                console.log("Save view");
              },
              priority: "primary",
            },
            {
              label: "New Filter",
              icon: Filter,
              onClick: () => {
                console.log("New filter");
              },
              priority: "secondary",
            },
            {
              label: "Export CSV",
              icon: Download,
              onClick: () => {
                console.log("Export CSV");
              },
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

