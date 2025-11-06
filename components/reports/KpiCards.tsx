"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Users, TrendingUp, FileText } from "lucide-react";
import { motion } from "framer-motion";

type KpiCardsProps = {
  kpis: {
    pendingApprovals: number;
    approvedLeaves: number;
    avgApprovalTime: number;
    totalEmployees: number;
    utilizationRate: number;
  };
  duration: string;
  isLoading?: boolean;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function KpiCards({ kpis, duration, isLoading }: KpiCardsProps) {
  const durationLabel = duration === "month" ? "This Month" : duration === "quarter" ? "This Quarter" : "This Year";

  const cards = [
    {
      title: "Pending Approvals",
      value: kpis.pendingApprovals,
      icon: FileText,
      trend: durationLabel,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      title: "Approved Leaves",
      value: kpis.approvedLeaves,
      icon: CheckCircle2,
      trend: durationLabel,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      title: "Avg Approval Time",
      value: `${kpis.avgApprovalTime} days`,
      icon: Clock,
      trend: durationLabel,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Total Employees",
      value: kpis.totalEmployees,
      icon: Users,
      trend: "Organization",
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    },
    {
      title: "Utilization Rate",
      value: `${kpis.utilizationRate}%`,
      icon: TrendingUp,
      trend: durationLabel,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="glass-card hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.trend}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

