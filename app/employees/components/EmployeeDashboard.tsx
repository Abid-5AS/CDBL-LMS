"use client";

import type { EmployeeDashboardData } from "@/lib/employee";
import {
  useDashboardLayout,
  type DashboardSectionId,
} from "@/hooks/useDashboardLayout";
import { DashboardContainer, SectionHeader } from "@/components";
import { EmployeeProfileCard, LeaveHistoryTable } from "@/components/shared";
import { LeaveBalanceCard } from "./LeaveBalanceCard";
import ChartsSection from "./ChartsSection";
import { HRStatCards } from "@/components/HRStatCards";
import { ApprovalActions } from "./ApprovalActions";
import { canEditEmployee, type AppRole } from "@/lib/rbac";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useState,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { motion, useReducedMotion } from "framer-motion";
import { getIcon, iconSizes } from "@/lib/icons";
import { slideUp, staggerChildren } from "@/lib/animations";

const SECTION_MAP = {
  Overview: "Overview",
  Analytics: "Analytics",
  History: "History",
} as const;

const CustomizeIcon = getIcon("SlidersHorizontal");
const ResetIcon = getIcon("RefreshCcw");
const BackIcon = getIcon("ArrowLeft");
const EditIcon = getIcon("Edit");
const DisableIcon = getIcon("Ban");

type EmployeeDashboardProps = {
  data: EmployeeDashboardData;
  pendingRequestId?: number | null;
  viewerRole?: AppRole;
  isHRView?: boolean;
};

export function EmployeeDashboard({
  data,
  pendingRequestId,
  viewerRole,
  isHRView = false,
}: EmployeeDashboardProps) {
  const router = useRouter();
  const { layout, saveLayout, resetLayout, defaultLayout } =
    useDashboardLayout();
  const [customizeMode, setCustomizeMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Prevent hydration mismatch by only rendering client-side layout after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const sections = useMemo<Record<DashboardSectionId, ReactNode>>(
    () => ({
      [SECTION_MAP.Overview]: (
        <section className="space-y-4">
          <SectionHeader title="Employee Overview" />
          <div className="grid gap-4 xl:grid-cols-2">
            <EmployeeProfileCard
              name={data.name}
              email={data.email}
              department={data.department}
              designation={data.designation}
              manager={data.manager}
              joiningDate={data.joiningDate}
              employmentStatus={data.employmentStatus}
            />
            <LeaveBalanceCard balances={data.balances} />
          </div>
        </section>
      ),
      [SECTION_MAP.Analytics]: (
        <section className="space-y-4">
          <SectionHeader title="Balances & Analytics" />
          <ChartsSection
            trend={data.monthlyTrend}
            distribution={data.distribution}
          />
        </section>
      ),
      [SECTION_MAP.History]: (
        <section className="space-y-4">
          <SectionHeader title="Leave History" />
          <LeaveHistoryTable history={data.history} />
        </section>
      ),
    }),
    [data]
  );

  // Use default layout on server to prevent hydration mismatch
  const activeLayout = mounted && layout.length ? layout : [...defaultLayout];

  const roleSlug = (data.role ?? "EMPLOYEE").toLowerCase().replace(/_/g, "-");
  const roleAccentStyles = useMemo(
    () =>
      ({
        "--dashboard-accent": `var(--role-${roleSlug}-accent)`,
        "--dashboard-accent-soft": `var(--role-${roleSlug}-accent-soft)`,
      } as CSSProperties),
    [roleSlug]
  );
  const cardSurfaceStyle = useMemo(
    () =>
      ({
        background: "color-mix(in srgb, var(--card) 90%, transparent)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-md)",
      } as CSSProperties),
    []
  );

  return (
    <div
      className="relative min-h-screen overflow-hidden pb-24"
      style={roleAccentStyles}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-80 dark:opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 12% 18%, var(--dashboard-accent-soft) 0%, transparent 55%), radial-gradient(circle at 85% -5%, rgba(129, 140, 248, 0.18) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto w-full max-w-[1400px] px-4 py-10 space-y-8">
        <motion.header
          variants={slideUp(
            { distance: 24, duration: 0.4 },
            prefersReducedMotion ?? false
          )}
          initial="initial"
          animate="animate"
          className="rounded-3xl border border-border bg-card shadow-sm"
          style={cardSurfaceStyle}
        >
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-3">
              <Link
                href="/approvals"
                className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--dashboard-accent)] transition-colors hover:opacity-80"
              >
                <BackIcon size={iconSizes.sm} strokeWidth={2.2} />
                Back to Approvals
              </Link>
              <div>
                <h1 className="text-3xl font-semibold leading-tight text-foreground">
                  {data.name}
                </h1>
                <p className="text-sm text-muted-foreground">{data.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-[var(--dashboard-accent-soft)] px-3 py-1 font-medium text-[color:var(--dashboard-accent)]">
                  {data.department
                    ? `${data.department}`
                    : "Department not specified"}
                </span>
                {data.designation && (
                  <span className="rounded-full bg-muted/60 px-3 py-1 text-foreground/70">
                    {data.designation}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant={customizeMode ? "default" : "outline"}
                onClick={() => setCustomizeMode((prev) => !prev)}
                className={cn(
                  "min-w-[180px] justify-center gap-2",
                  customizeMode
                    ? "bg-[color:var(--dashboard-accent)] text-text-inverted hover:bg-[color-mix(in_srgb,var(--dashboard-accent) 88%,#000 12%)] dark:hover:bg-[color-mix(in_srgb,var(--dashboard-accent) 82%,#fff 18%)]"
                    : "border border-[color:var(--dashboard-accent)] text-[color:var(--dashboard-accent)] hover:bg-[var(--dashboard-accent-soft)]"
                )}
              >
                <CustomizeIcon size={iconSizes.md} strokeWidth={2.1} />
                {customizeMode ? "Done Customizing" : "Customize Layout"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-w-[150px] justify-center gap-2 border border-border bg-transparent hover:bg-muted/70"
                onClick={() => {
                  resetLayout();
                  setCustomizeMode(false);
                }}
              >
                <ResetIcon size={iconSizes.md} strokeWidth={2.1} />
                Reset Layout
              </Button>
            </div>
          </div>
        </motion.header>

        <motion.section
          variants={staggerChildren(0.08)}
          initial="initial"
          animate="animate"
          className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
          <motion.div
            variants={slideUp(
              { distance: 28, duration: 0.45 },
              prefersReducedMotion ?? false
            )}
            className="space-y-4"
          >
            <DashboardContainer
              layout={activeLayout}
              customizeMode={customizeMode}
              saveLayout={(next) => saveLayout(next as DashboardSectionId[])}
              sections={sections}
            />
          </motion.div>
          <motion.aside
            variants={slideUp(
              { distance: 32, duration: 0.5 },
              prefersReducedMotion ?? false
            )}
            className="space-y-4"
          >
            <div
              className="sticky top-4 space-y-4 rounded-3xl border border-border bg-card p-1.5 shadow-sm"
              style={cardSurfaceStyle}
            >
              <HRStatCards stats={data.stats} />
            </div>
          </motion.aside>
        </motion.section>
      </div>

      <motion.div
        variants={slideUp(
          { distance: 32, duration: 0.45 },
          prefersReducedMotion ?? false
        )}
        initial="initial"
        animate="animate"
      >
        <ApprovalActions
          pendingRequestId={pendingRequestId}
          employeeName={data.name}
          employeeRole={data.role}
          status={pendingRequestId ? "Pending HR Review" : "No pending request"}
        />
      </motion.div>

      {isHRView &&
        viewerRole &&
        canEditEmployee(viewerRole, data.role as AppRole) && (
          <motion.div
            variants={slideUp(
              { distance: 36, duration: 0.5 },
              prefersReducedMotion ?? false
            )}
            initial="initial"
            animate="animate"
            className="mx-auto mt-8 w-full max-w-[1400px] px-4 pb-10"
          >
            <div
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
              style={cardSurfaceStyle}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Admin Actions
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage employee information and access controls
                  </p>
                </div>
                <span className="rounded-full bg-[var(--dashboard-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--dashboard-accent)]">
                  HR Tools
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => router.push(`/employees/${data.id}?edit=true`)}
                  variant="outline"
                  className="gap-2 border-[color:var(--dashboard-accent)] text-[color:var(--dashboard-accent)] hover:bg-[var(--dashboard-accent-soft)]"
                >
                  <EditIcon size={iconSizes.md} strokeWidth={2.1} />
                  Update Employee
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 border border-data-error bg-data-error/80 text-data-error hover:bg-data-error dark:border-data-error/40 dark:bg-data-error/10 dark:text-data-error"
                  disabled
                >
                  <DisableIcon size={iconSizes.md} strokeWidth={2.1} />
                  Deactivate Employee
                </Button>
              </div>
              <p className="mt-4 text-xs italic text-muted-foreground">
                Note: Deactivation feature coming soon.
              </p>
            </div>
          </motion.div>
        )}
    </div>
  );
}
