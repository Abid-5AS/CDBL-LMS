"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Download,
  FileText,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Play,
  RefreshCw,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface Balance {
  id: number;
  type: string;
  year: number;
  opening: number;
  accrued: number;
  used: number;
  closing: number;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  empCode: string | null;
  department: string | null;
  role: string;
  balances: Balance[];
}

interface ImportError {
  row: number;
  error: string;
}

const LEAVE_TYPES = ["EARNED", "CASUAL", "MEDICAL", "SPECIAL"] as const;

function getBalanceForType(balances: Balance[], type: string): Balance | null {
  return balances.find((b) => b.type === type) || null;
}

export function AdminBalanceManagement({ userRole }: { userRole: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [department, setDepartment] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Adjustment modal state
  const [adjustDialog, setAdjustDialog] = useState(false);
  const [adjustEmployee, setAdjustEmployee] = useState<Employee | null>(null);
  const [adjustType, setAdjustType] = useState<string>("EARNED");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Import state
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    imported: number;
    failed: number;
    errors: ImportError[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Year actions state
  const [jobRunning, setJobRunning] = useState<string | null>(null);
  const [jobDialog, setJobDialog] = useState<{
    job: string;
    title: string;
    confirm: string;
  } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        page: String(page),
        limit: "25",
      });
      if (department) params.set("department", department);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/admin/balance/all?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setEmployees(data.employees);
      setDepartments(data.departments);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      toast.error("Failed to load balance data");
    } finally {
      setLoading(false);
    }
  }, [year, page, department, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [department, debouncedSearch, year]);

  const handleExport = async (importReady = false) => {
    try {
      const params = new URLSearchParams({ year: String(year) });
      if (department) params.set("department", department);
      if (importReady) params.set("format", "import");

      const res = await fetch(`/api/admin/balance/export?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `balance_export_${year}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Balance data exported successfully");
    } catch {
      toast.error("Failed to export balance data");
    }
  };

  const handleTemplateDownload = async () => {
    try {
      const res = await fetch("/api/admin/balance/import");
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "balance_import_template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Template downloaded");
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleImportPreview = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("dryRun", "true");

      const res = await fetch("/api/admin/balance/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Preview failed");

      setImportPreview({
        imported: data.imported,
        failed: data.failed,
        errors: data.errors,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to preview import"
      );
    } finally {
      setImporting(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;
    setImporting(true);

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("dryRun", "false");

      const res = await fetch("/api/admin/balance/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import failed");

      toast.success(
        `Successfully imported ${data.imported} records${data.failed > 0 ? `, ${data.failed} failed` : ""}`
      );
      setImportDialog(false);
      setImportFile(null);
      setImportPreview(null);
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import balances"
      );
    } finally {
      setImporting(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustEmployee || !adjustAmount || !adjustReason) return;
    setAdjusting(true);

    try {
      const res = await fetch("/api/admin/balance/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: adjustEmployee.id,
          leaveType: adjustType,
          year,
          amount: parseInt(adjustAmount),
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adjustment failed");

      toast.success("Balance adjusted successfully");
      setAdjustDialog(false);
      setAdjustAmount("");
      setAdjustReason("");
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to adjust balance"
      );
    } finally {
      setAdjusting(false);
    }
  };

  const openAdjust = (employee: Employee) => {
    setAdjustEmployee(employee);
    setAdjustType("EARNED");
    setAdjustAmount("");
    setAdjustReason("");
    setAdjustDialog(true);
  };

  const runJob = async (job: string, params?: Record<string, unknown>) => {
    setJobRunning(job);
    try {
      const res = await fetch("/api/admin/jobs/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job, params: params ?? {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Job failed");
      toast.success(data.message || `${job} completed`);
      setJobDialog(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Job failed");
    } finally {
      setJobRunning(null);
    }
  };

  const handleInitYear = () => {
    runJob("init-year", { year, proRata: true, overwrite: false });
  };

  const years = Array.from({ length: 5 }, (_, i) =>
    new Date().getFullYear() - 2 + i
  );

  const canAdjust = userRole === "SYSTEM_ADMIN";
  const canRunJobs = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN", "CEO"].includes(userRole);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Balance Management
          </h1>
          <p className="text-muted-foreground">
            View and manage employee leave balances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport(false)}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport(true)} title="Minimal format for re-import">
            <Download className="mr-2 h-4 w-4" />
            Export for Re-import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setImportDialog(true);
              setImportFile(null);
              setImportPreview(null);
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={department || "all"}
              onValueChange={(v) => setDepartment(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Year Actions */}
      {canRunJobs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Year Actions</CardTitle>
            <CardDescription>
              Semi-automatic jobs for balance maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!!jobRunning}
                onClick={handleInitYear}
              >
                {jobRunning === "init-year" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Initialize {year} (CL/ML)
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!!jobRunning}
                onClick={() =>
                  runJob("el-accrual", {
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() - 1,
                  })
                }
              >
                {jobRunning === "el-accrual" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run EL Accrual (Prev Month)
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!!jobRunning}
                onClick={() =>
                  setJobDialog({
                    job: "year-end-rollover",
                    title: "Run Year-End Rollover",
                    confirm: `Roll EL from ${year - 1} to ${year}? Run after auto-lapse.`,
                  })
                }
              >
                {jobRunning === "year-end-rollover" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Year-End Rollover
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job confirmation dialog */}
      {jobDialog && (
        <Dialog open={!!jobDialog} onOpenChange={() => setJobDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{jobDialog.title}</DialogTitle>
              <DialogDescription>{jobDialog.confirm}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setJobDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => runJob(jobDialog.job, { year: year - 1 })}
                disabled={!!jobRunning}
              >
                {jobRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Balances</CardTitle>
              <CardDescription>
                {total} employee{total !== 1 ? "s" : ""} found for {year}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mb-2" />
              <p>No employees found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center" colSpan={2}>
                        Earned Leave
                      </TableHead>
                      <TableHead className="text-center" colSpan={2}>
                        Casual Leave
                      </TableHead>
                      <TableHead className="text-center" colSpan={2}>
                        Medical Leave
                      </TableHead>
                      <TableHead className="text-center" colSpan={2}>
                        Special Leave
                      </TableHead>
                      {canAdjust && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                    <TableRow>
                      <TableHead />
                      <TableHead />
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Used
                      </TableHead>
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Balance
                      </TableHead>
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Used
                      </TableHead>
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Balance
                      </TableHead>
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Used
                      </TableHead>
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Balance
                      </TableHead>
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Used
                      </TableHead>
                      <TableHead className="text-center text-xs font-normal text-muted-foreground">
                        Balance
                      </TableHead>
                      {canAdjust && <TableHead />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const earned = getBalanceForType(
                        emp.balances,
                        "EARNED"
                      );
                      const casual = getBalanceForType(
                        emp.balances,
                        "CASUAL"
                      );
                      const medical = getBalanceForType(
                        emp.balances,
                        "MEDICAL"
                      );
                      const special = getBalanceForType(
                        emp.balances,
                        "SPECIAL"
                      );
                      return (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {emp.empCode || emp.email}
                                </p>
                              </div>
                              <Link
                                href={`/admin/audit?target=${encodeURIComponent(emp.email)}`}
                                className="text-muted-foreground hover:text-foreground"
                                title="View balance history in audit"
                              >
                                <History className="h-4 w-4" />
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell>
                            {emp.department ? (
                              <Badge variant="secondary" className="text-xs">
                                {emp.department}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {earned?.used ?? 0}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <BalanceBadge value={earned?.closing ?? 0} />
                          </TableCell>
                          <TableCell className="text-center">
                            {casual?.used ?? 0}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <BalanceBadge value={casual?.closing ?? 0} />
                          </TableCell>
                          <TableCell className="text-center">
                            {medical?.used ?? 0}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <BalanceBadge value={medical?.closing ?? 0} />
                          </TableCell>
                          <TableCell className="text-center">
                            {special?.used ?? 0}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <BalanceBadge value={special?.closing ?? 0} />
                          </TableCell>
                          {canAdjust && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAdjust(emp)}
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogDescription>
              Adjust leave balance for{" "}
              <strong>{adjustEmployee?.name}</strong> (
              {adjustEmployee?.empCode || adjustEmployee?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={adjustType} onValueChange={setAdjustType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Amount (positive to credit, negative to debit)
              </Label>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="e.g. 5 or -3"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (min 10 characters)</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Reason for adjustment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={
                adjusting ||
                !adjustAmount ||
                adjustReason.length < 10
              }
            >
              {adjusting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialog}
        onOpenChange={(open) => {
          setImportDialog(open);
          if (!open) {
            setImportFile(null);
            setImportPreview(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Balances from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with employee balance data. Download the
              template first to see the expected format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTemplateDownload}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Template
            </Button>

            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setImportFile(e.target.files?.[0] || null);
                  setImportPreview(null);
                }}
              />
            </div>

            {importPreview && (
              <div className="rounded-md border p-4 space-y-2">
                <p className="font-medium text-sm">Dry Run Results:</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">
                    {importPreview.imported} would be imported
                  </span>
                  {importPreview.failed > 0 && (
                    <span className="text-red-600">
                      {importPreview.failed} errors
                    </span>
                  )}
                </div>
                {importPreview.errors.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs space-y-1">
                    {importPreview.errors.map((err, i) => (
                      <p key={i} className="text-red-600">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialog(false)}
            >
              Cancel
            </Button>
            {!importPreview ? (
              <Button
                onClick={handleImportPreview}
                disabled={!importFile || importing}
              >
                {importing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Preview Import
              </Button>
            ) : (
              <Button
                onClick={handleImportConfirm}
                disabled={importing || importPreview.imported === 0}
              >
                {importing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Import ({importPreview.imported} records)
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BalanceBadge({ value }: { value: number }) {
  const variant =
    value <= 0 ? "destructive" : value <= 3 ? "secondary" : "default";
  return (
    <Badge variant={variant} className="tabular-nums">
      {value}
    </Badge>
  );
}
