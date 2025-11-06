import { LeaveBalancePanel, type Balance } from "@/components/shared/LeaveBalancePanel";

type LeaveBalanceCardProps = {
  balances: {
    type: string;
    used: number;
    total: number;
    remaining: number;
  }[];
};

/**
 * LeaveBalanceCard - Wrapper around LeaveBalancePanel for backward compatibility
 * 
 * @deprecated This component is deprecated and will be removed in a future version.
 * Use LeaveBalancePanel directly from @/components/shared/LeaveBalancePanel
 * 
 * Migration:
 * ```tsx
 * // Before
 * <LeaveBalanceCard balances={balances} />
 * 
 * // After
 * import { LeaveBalancePanel, fromDashboardSummary } from "@/components/shared/LeaveBalancePanel";
 * <LeaveBalancePanel balances={fromDashboardSummary(balances)} variant="full" />
 * ```
 */
export function LeaveBalanceCard({ balances }: LeaveBalanceCardProps) {
  // Convert old format to new Balance format
  const convertedBalances: Balance[] = balances.map((b) => ({
    type: b.type as Balance["type"],
    used: b.used,
    total: b.total,
  }));

  return (
    <div className="rounded-lg border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-4">
        Leave Balances
      </h3>
      <LeaveBalancePanel
        balances={convertedBalances}
        variant="full"
        showMeters={true}
        showPolicyHints={false}
      />
    </div>
  );
}
