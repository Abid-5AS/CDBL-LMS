"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  type BreadcrumbItem,
  type BreadcrumbAction,
} from "@/components/ui/breadcrumb";

interface PageHeaderProps {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: BreadcrumbAction[];
  children?: React.ReactNode;
  className?: string;
  showBreadcrumbs?: boolean;
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions = [],
  children,
  className,
  showBreadcrumbs = true,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 pb-6", className)}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Breadcrumb items={breadcrumbs} actions={actions} />
        </motion.div>
      )}

      {/* Page Title and Description */}
      {(title || description) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-2"
        >
          {title && (
            <h1 className="text-display-sm font-bold text-foreground tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-body-lg text-muted-foreground max-w-3xl">
              {description}
            </p>
          )}
        </motion.div>
      )}

      {/* Custom Content */}
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

// Preset page headers for common pages
export function DashboardHeader({ actions }: { actions?: BreadcrumbAction[] }) {
  return (
    <PageHeader
      title="Dashboard"
      description="Overview of your leave management and recent activities"
      breadcrumbs={[{ label: "Dashboard", current: true }]}
      actions={actions}
    />
  );
}

export function LeavesHeader({ actions }: { actions?: BreadcrumbAction[] }) {
  return (
    <PageHeader
      title="My Leaves"
      description="View and manage your leave requests and history"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Leaves", current: true },
      ]}
      actions={actions}
    />
  );
}

export function ApplyLeaveHeader({
  actions,
}: {
  actions?: BreadcrumbAction[];
}) {
  return (
    <PageHeader
      title="Apply for Leave"
      description="Submit a new leave request with all required details"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Leaves", href: "/leaves" },
        { label: "Apply", current: true },
      ]}
      actions={actions}
    />
  );
}

export function BalanceHeader({ actions }: { actions?: BreadcrumbAction[] }) {
  return (
    <PageHeader
      title="Leave Balance"
      description="Check your available leave balance and accrual details"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Balance", current: true },
      ]}
      actions={actions}
    />
  );
}

export function EmployeesHeader({ actions }: { actions?: BreadcrumbAction[] }) {
  return (
    <PageHeader
      title="Employee Directory"
      description="Browse and manage employee information and leave records"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Employees", current: true },
      ]}
      actions={actions}
    />
  );
}

export function ReportsHeader({ actions }: { actions?: BreadcrumbAction[] }) {
  return (
    <PageHeader
      title="Reports & Analytics"
      description="Generate and view detailed leave reports and analytics"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Reports", current: true },
      ]}
      actions={actions}
    />
  );
}

export function ApprovalsHeader({ actions }: { actions?: BreadcrumbAction[] }) {
  return (
    <PageHeader
      title="Leave Approvals"
      description="Review and process pending leave requests"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Approvals", current: true },
      ]}
      actions={actions}
    />
  );
}

export function SettingsHeader({ actions }: { actions?: BreadcrumbAction[] }) {
  return (
    <PageHeader
      title="Settings"
      description="Configure your preferences and account settings"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Settings", current: true },
      ]}
      actions={actions}
    />
  );
}
