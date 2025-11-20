import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["node_modules/**"],
  },
  {
    files: ["**/*.{js,ts,jsx,tsx}"],
    rules: {
      // Ban deprecated chart component imports
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/dashboard/LeaveTrendChart",
              message: "LeaveTrendChart is deprecated. Use @/components/shared/LeaveCharts/TrendChart instead.",
            },
            {
              name: "@/components/dashboard/LeaveTypePieChart",
              message: "LeaveTypePieChart is deprecated. Use @/components/shared/LeaveCharts/TypePie instead.",
            },
            {
              name: "@/components/dashboard/LeaveBalanceCards",
              message: "LeaveBalanceCards is deprecated. Use @/components/shared/LeaveBalancePanel instead.",
            },
            {
              name: "@/components/dashboard/LeaveBalancesCompact",
              message: "LeaveBalancesCompact is deprecated. Use @/components/shared/LeaveBalancePanel with variant='compact' instead.",
            },
            {
              name: "@/components/dashboard/BalanceMetersGroup",
              message: "BalanceMetersGroup is deprecated. Use @/components/shared/LeaveBalancePanel instead.",
            },
            {
              name: "@/components/dashboard/ApprovalTimeline",
              message: "ApprovalTimeline is deprecated. Use @/components/shared/SharedTimeline with ApprovalTimelineAdapter instead.",
            },
          ],
          patterns: [
            {
              group: ["**/components/dashboard/**"],
              message: "Dashboards must import from @shared or @dash only. Use @shared/* for primitives or @dash/* for role-specific components.",
            },
          ],
        },
      ],
      // Nudge contributors to use design tokens over inline color literals
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message: "Use design tokens or Tailwind semantic colors instead of inline hex values.",
        },
        {
          selector: "Literal[value=/^(rgb|rgba|hsl|hsla)\\(/i]",
          message: "Use design tokens or Tailwind semantic colors instead of inline color values.",
        },
      ],
    },
  },
];

export default eslintConfig;
