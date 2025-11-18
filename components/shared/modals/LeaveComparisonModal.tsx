"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  Badge,
} from "@/components/ui";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { leaveTypeLabel } from "@/lib/ui";

type LeaveVersion = {
  id: number;
  version: number;
  data: {
    type: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    reason: string;
    needsCertificate?: boolean;
    certificateUrl?: string | null;
    fitnessCertificateUrl?: string | null;
    status: string;
  };
  createdAt: string;
  createdByRole: string;
};

type LeaveComparisonModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveId: number;
  currentLeave: {
    type: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    reason: string;
    needsCertificate?: boolean;
    certificateUrl?: string | null;
    fitnessCertificateUrl?: string | null;
  };
};

export function LeaveComparisonModal({
  open,
  onOpenChange,
  leaveId,
  currentLeave,
}: LeaveComparisonModalProps) {
  const [versions, setVersions] = useState<LeaveVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  useEffect(() => {
    if (open && leaveId) {
      fetchVersions();
    }

    // Cleanup function - not strictly necessary for this useEffect but good practice
    return () => {
      // No specific cleanup needed for this component
      // The state will be handled by React's unmounting process
    };
  }, [open, leaveId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leaves/${leaveId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
        // Select the latest version for comparison
        if (data.versions && data.versions.length > 0) {
          setSelectedVersion(data.versions[data.versions.length - 1].version);
        }
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const oldVersion = versions.find((v) => v.version === selectedVersion);
  const hasChanges =
    oldVersion &&
    (oldVersion.data.type !== currentLeave.type ||
      oldVersion.data.startDate !== currentLeave.startDate ||
      oldVersion.data.endDate !== currentLeave.endDate ||
      oldVersion.data.reason !== currentLeave.reason ||
      oldVersion.data.workingDays !== currentLeave.workingDays);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Changes in Leave Request</DialogTitle>
          <DialogDescription>
            This request was modified and resubmitted. Compare the previous
            version with the current version.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !oldVersion ? (
          <div className="text-center py-8 text-muted-foreground">
            No previous version found for comparison.
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Version Selector */}
            {versions.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Compare with version:
                </span>
                <select
                  value={selectedVersion || ""}
                  onChange={(e) => setSelectedVersion(Number(e.target.value))}
                  className="px-3 py-1.5 text-sm border rounded-md"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      Version {v.version} (
                      {new Date(v.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Column */}
              <div>
                <h4 className="font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Before
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Version {oldVersion.version}
                  </span>
                </h4>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Type:
                      </span>
                      <p className="text-sm">
                        {leaveTypeLabel[oldVersion.data.type] ||
                          oldVersion.data.type}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Dates:
                      </span>
                      <p className="text-sm">
                        {formatDate(oldVersion.data.startDate)} →{" "}
                        {formatDate(oldVersion.data.endDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Working Days:
                      </span>
                      <p className="text-sm">{oldVersion.data.workingDays}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Reason:
                      </span>
                      <p className="text-sm whitespace-pre-wrap">
                        {oldVersion.data.reason}
                      </p>
                    </div>
                    {oldVersion.data.needsCertificate && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Certificate:
                        </span>
                        <p className="text-sm">
                          {oldVersion.data.certificateUrl
                            ? "Attached"
                            : "Required"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* After Column */}
              <div>
                <h4 className="font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    After
                  </Badge>
                  <span className="text-xs text-muted-foreground">Current</span>
                </h4>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Type:
                      </span>
                      <p
                        className={`text-sm ${
                          oldVersion.data.type !== currentLeave.type
                            ? "bg-data-warning dark:bg-data-warning/30 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {leaveTypeLabel[currentLeave.type] || currentLeave.type}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Dates:
                      </span>
                      <p
                        className={`text-sm ${
                          oldVersion.data.startDate !==
                            currentLeave.startDate ||
                          oldVersion.data.endDate !== currentLeave.endDate
                            ? "bg-data-warning dark:bg-data-warning/30 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {formatDate(currentLeave.startDate)} →{" "}
                        {formatDate(currentLeave.endDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Working Days:
                      </span>
                      <p
                        className={`text-sm ${
                          oldVersion.data.workingDays !==
                          currentLeave.workingDays
                            ? "bg-data-warning dark:bg-data-warning/30 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {currentLeave.workingDays}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Reason:
                      </span>
                      <p
                        className={`text-sm whitespace-pre-wrap ${
                          oldVersion.data.reason !== currentLeave.reason
                            ? "bg-data-warning dark:bg-data-warning/30 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {currentLeave.reason}
                      </p>
                    </div>
                    {currentLeave.needsCertificate && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Certificate:
                        </span>
                        <p className="text-sm">
                          {currentLeave.certificateUrl
                            ? "Attached"
                            : "Required"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {!hasChanges && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No changes detected between versions.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
