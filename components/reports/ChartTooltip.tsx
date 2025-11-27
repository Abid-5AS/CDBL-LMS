"use client";
import { RechartsGlassTooltip } from "@/components/ui/recharts-glass-tooltip";

/**
 * Custom tooltip for Recharts with Material 3 + Glass aesthetic
 * Matches the design tokens from the unified tooltip component
 */
export function ChartTooltip({ active, payload, label }: any) {
  return <RechartsGlassTooltip active={active} payload={payload} label={label} />;
}

