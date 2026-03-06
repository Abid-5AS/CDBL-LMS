"use client";

import * as React from "react";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { toast } from "sonner";

export function BulkLeaveImport() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ row: number; error: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const downloadTemplate = async () => {
    try {
      const res = await fetch("/api/leaves/import?template=true");
      if (!res.ok) throw new Error("Failed to download template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leaves_import_template.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Template downloaded!");
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(f);
      setErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }
    setImporting(true);
    setErrors([]);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/leaves/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.error || "Failed to import leaves");
        setImporting(false);
        return;
      }

      const result = data.data;
      const imported = result?.success ?? 0;
      const failed = result?.failed ?? 0;
      const errs = result?.errors ?? [];

      if (errs.length > 0) {
        setErrors(errs.map((e: { row: number; error: string }) => ({ row: e.row, error: e.error })));
      }

      if (imported > 0) {
        toast.success(
          `Successfully imported ${imported} leave(s)${failed > 0 ? `. ${failed} failed.` : "!"}`
        );
        setDialogOpen(false);
        setFile(null);
        setErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else if (failed > 0) {
        toast.error(`Import failed. ${failed} error(s). Please fix and try again.`);
      } else {
        toast.error("No leaves imported. Check CSV format.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to import leaves");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Bulk Leave Import
        </CardTitle>
        <CardDescription>
          Import pre-approved leave records from CSV. Use employee email to identify each leave.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="size-4 mr-2" />
            Download Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Upload className="size-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Leaves from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import pre-approved leaves. Download the template for the required format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
            </div>
            <div className="rounded-lg bg-muted/50 border p-4">
              <h4 className="text-sm font-medium mb-2">CSV Format</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Columns: employeeEmail, type, startDate, endDate, reason, workingDays (optional)</li>
                <li>Required: employeeEmail, type, startDate, endDate, reason</li>
                <li>Types: EARNED, CASUAL, MEDICAL, SPECIAL, etc.</li>
                <li>Imported leaves are created as APPROVED</li>
              </ul>
            </div>
            {errors.length > 0 && (
              <div className="rounded-lg border border-destructive/50 p-4 max-h-48 overflow-y-auto">
                <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  Validation Errors ({errors.length})
                </h4>
                <div className="space-y-1">
                  {errors.map((e, i) => (
                    <div key={i} className="text-sm text-destructive">
                      Row {e.row}: {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setFile(null);
                setErrors([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? "Importing..." : "Import Leaves"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
