"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

const JOBS = [
  {
    id: "el-accrual",
    label: "EL Accrual",
    description: "Add 2 EL days per employee for a month",
    params: ["year", "month"],
    defaultParams: { year: new Date().getFullYear(), month: new Date().getMonth() - 1 },
  },
  {
    id: "auto-lapse",
    label: "Auto-Lapse",
    description: "Reset CL, ML, Quarantine balances for a year",
    params: ["year"],
    defaultParams: { year: new Date().getFullYear() },
  },
  {
    id: "year-end-rollover",
    label: "Year-End Rollover",
    description: "Carry EL to next year (up to 60 days), excess to SPECIAL",
    params: ["year"],
    defaultParams: { year: new Date().getFullYear() - 1 },
  },
  {
    id: "init-year",
    label: "Initialize Year",
    description: "Create CL/ML balances for a year (pro-rata for mid-year joiners). Retroactive EL for mid-year launch.",
    params: ["year", "overwrite", "retroactiveEL"],
    defaultParams: { year: new Date().getFullYear(), overwrite: false, retroactiveEL: false },
  },
] as const;

const ACTION_TO_JOB: Record<string, string> = {
  EL_ACCRUED: "el-accrual",
  CASUAL_LAPSED: "auto-lapse",
  MEDICAL_LAPSED: "auto-lapse",
  QUARANTINE_LAPSED: "auto-lapse",
  YEAR_END_ROLLOVER: "year-end-rollover",
  ANNUAL_BALANCE_INIT: "init-year",
};

interface LastRun {
  jobId: string;
  at: string;
  details?: string;
}

export function JobsMaintenancePanel() {
  const [running, setRunning] = useState<string | null>(null);
  const [lastRuns, setLastRuns] = useState<LastRun[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, Record<string, string | number | boolean>>>({});

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((data) => {
        const runs: LastRun[] = [];
        for (const log of data.items || []) {
          const jobId = ACTION_TO_JOB[log.action];
          if (jobId && !runs.find((r) => r.jobId === jobId)) {
            runs.push({
              jobId,
              at: log.createdAt,
              details: log.details?.month || log.details?.year?.toString?.(),
            });
          }
        }
        setLastRuns(runs);
      })
      .catch(() => {});
  }, [running]);

  const runJob = async (jobId: string) => {
    setRunning(jobId);
    try {
      const job = JOBS.find((j) => j.id === jobId);
      const custom = paramValues[jobId] ?? {};
      const params = job
        ? {
            ...job.defaultParams,
            ...(typeof custom.year === "number" ? { year: custom.year } : {}),
            ...(typeof custom.month === "number" ? { month: custom.month } : {}),
            ...(typeof custom.overwrite === "boolean" ? { overwrite: custom.overwrite } : {}),
            ...(typeof custom.retroactiveEL === "boolean" ? { retroactiveEL: custom.retroactiveEL } : {}),
          }
        : {};
      const res = await fetch("/api/admin/jobs/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: jobId, params }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Job failed");
      toast.success(data.message || `${jobId} completed`);
      setLastRuns((prev) => [
        { jobId, at: new Date().toISOString(), details: data.summary?.processed?.toString() },
        ...prev.filter((r) => r.jobId !== jobId),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Job failed");
    } finally {
      setRunning(null);
    }
  };

  const getLastRun = (jobId: string) =>
    lastRuns.find((r) => r.jobId === jobId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Scheduled Jobs</h3>
          <p className="text-sm text-muted-foreground">
            Run balance maintenance jobs manually
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {JOBS.map((job) => (
          <Card key={job.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{job.label}</span>
                <Button
                  size="sm"
                  disabled={!!running}
                  onClick={() => runJob(job.id)}
                >
                  {running === job.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  Run
                </Button>
              </CardTitle>
              <CardDescription>{job.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {getLastRun(job.id) && (
                <p className="text-xs text-muted-foreground">
                  Last run: {new Date(getLastRun(job.id)!.at).toLocaleString()}
                  {getLastRun(job.id)!.details && ` (${getLastRun(job.id)!.details})`}
                </p>
              )}
              <div className="flex flex-wrap gap-4 pt-2">
                {job.params.includes("year") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Year</Label>
                    <Input
                      type="number"
                      className="w-24 h-8"
                      defaultValue={job.defaultParams.year}
                      onChange={(e) =>
                        setParamValues((prev) => ({
                          ...prev,
                          [job.id]: {
                            ...(prev[job.id] ?? {}),
                            year: parseInt(e.target.value) || job.defaultParams.year,
                          },
                        }))
                      }
                    />
                  </div>
                )}
                {job.params.includes("month") && (
                  <div className="space-y-1">
                    <Label className="text-xs">Month (0–11)</Label>
                    <Input
                      type="number"
                      className="w-24 h-8"
                      min={0}
                      max={11}
                      defaultValue={job.defaultParams.month}
                      onChange={(e) =>
                        setParamValues((prev) => ({
                          ...prev,
                          [job.id]: {
                            ...(prev[job.id] ?? {}),
                            month: parseInt(e.target.value) ?? job.defaultParams.month,
                          },
                        }))
                      }
                    />
                  </div>
                )}
                {job.params.includes("overwrite") && (
                  <div className="space-y-1 flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [job.id]: {
                              ...(prev[job.id] ?? {}),
                              overwrite: e.target.checked,
                            },
                          }))
                        }
                      />
                      Overwrite existing
                    </label>
                  </div>
                )}
                {job.params.includes("retroactiveEL") && (
                  <div className="space-y-1 flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setParamValues((prev) => ({
                            ...prev,
                            [job.id]: {
                              ...(prev[job.id] ?? {}),
                              retroactiveEL: e.target.checked,
                            },
                          }))
                        }
                      />
                      Retroactive EL (mid-year launch)
                    </label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
