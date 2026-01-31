"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getIcon, iconSizes } from "@/lib/ui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Icons
const SparklesIcon = getIcon("Sparkles");
const CalendarIcon = getIcon("Calendar");
const AlertTriangleIcon = getIcon("AlertTriangle");
const CheckCircleIcon = getIcon("CheckCircle");
const ClockIcon = getIcon("Clock");
const ArrowRightIcon = getIcon("ArrowRight");
const XIcon = getIcon("X");

type RecommendationType =
  | "holiday_bridge"
  | "balance_optimization"
  | "certificate_reminder"
  | "consecutive_warning"
  | "rest_recharge"
  | "policy_guard";

interface Recommendation {
  type: RecommendationType;
  title: string;
  message: string;
  severity: "info" | "warning";
  action?: {
    label: string;
    href: string;
  };
}

export function SmartLeaveAssistant() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/dashboard/recommendations");
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations);
        }
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return null;
  if (recommendations.length === 0) return null;

  const activeRecommendations = recommendations.filter(
    (_, index) => !dismissed.includes(index)
  );

  if (activeRecommendations.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
          <SparklesIcon size={16} />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Smart Assistant
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {activeRecommendations.map((rec, index) => (
            <motion.div
              key={`${rec.type}-${index}`}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md",
                rec.severity === "warning"
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/10"
                  : "border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/30 dark:bg-indigo-950/10"
              )}
            >
              <button
                onClick={() => setDismissed((prev) => [...prev, index])}
                className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-black/5 hover:text-foreground group-hover:opacity-100 dark:hover:bg-white/10"
              >
                <XIcon size={14} />
              </button>

              <div className="space-y-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    rec.severity === "warning"
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                  )}
                >
                  {getIconForType(rec.type)}
                </div>

                <div>
                  <h3 className="font-medium text-foreground">{rec.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {rec.message}
                  </p>
                </div>
              </div>

              {rec.action && (
                <div className="mt-4 pt-3">
                  <Button
                    asChild
                    variant={rec.severity === "warning" ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "w-full justify-between gap-2",
                      rec.severity === "warning"
                        ? "border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    )}
                  >
                    <Link href={rec.action.href}>
                      {rec.action.label}
                      <ArrowRightIcon size={14} />
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function getIconForType(type: RecommendationType) {
  switch (type) {
    case "holiday_bridge":
      return <CalendarIcon size={20} />;
    case "balance_optimization":
      return <ClockIcon size={20} />;
    case "certificate_reminder":
      return <AlertTriangleIcon size={20} />;
    case "consecutive_warning":
      return <AlertTriangleIcon size={20} />;
    case "rest_recharge":
      return <SparklesIcon size={20} />;
    case "policy_guard":
      return <CheckCircleIcon size={20} />;
    default:
      return <SparklesIcon size={20} />;
  }
}
