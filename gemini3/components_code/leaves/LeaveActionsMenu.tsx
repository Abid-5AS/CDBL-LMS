/**
 * Leave Actions Menu Component
 *
 * Provides a dropdown menu with all available actions for a leave request:
 * - Extension Request
 * - Shorten Leave
 * - Partial Cancellation
 * - Full Cancellation
 * - Fitness Certificate Upload
 *
 * Actions are shown based on leave status and user permissions
 */

"use client";

import React, { useState } from "react";
import { MoreVertical, Plus, Scissors, XCircle, Upload, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ExtensionRequestModal,
  ShortenLeaveModal,
  PartialCancelModal,
} from "./LeaveActionModals";

interface LeaveActionsMenuProps {
  leaveId: number;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  workingDays: number;
  status: string;
  isOwner: boolean;
  needsFitnessCert?: boolean;
  canExtend?: boolean;
  canShorten?: boolean;
  canPartialCancel?: boolean;
  canCancel?: boolean;
}

export function LeaveActionsMenu({
  leaveId,
  leaveType,
  startDate,
  endDate,
  workingDays,
  status,
  isOwner,
  needsFitnessCert = false,
  canExtend = false,
  canShorten = false,
  canPartialCancel = false,
  canCancel = false,
}: LeaveActionsMenuProps) {
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [shortenOpen, setShortenOpen] = useState(false);
  const [partialCancelOpen, setPartialCancelOpen] = useState(false);

  // Determine if leave is ongoing
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const hasStarted = normalizedToday >= normalizedStart;
  const hasEnded = normalizedToday > normalizedEnd;
  const isOngoing = hasStarted && !hasEnded;

  // Only show menu if there are actions available
  const hasActions =
    isOwner &&
    (status === "APPROVED" || status === "PENDING" || status === "SUBMITTED") &&
    (canExtend || canShorten || canPartialCancel || canCancel || needsFitnessCert);

  if (!hasActions) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open actions menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Leave Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Extension Request - Only for ongoing approved leaves */}
          {status === "APPROVED" && isOngoing && (
            <DropdownMenuItem onClick={() => setExtensionOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Request Extension
            </DropdownMenuItem>
          )}

          {/* Shorten Leave - Only for ongoing approved leaves */}
          {status === "APPROVED" && isOngoing && (
            <DropdownMenuItem onClick={() => setShortenOpen(true)}>
              <Scissors className="mr-2 h-4 w-4" />
              Shorten Leave
            </DropdownMenuItem>
          )}

          {/* Partial Cancel - Only for ongoing approved leaves */}
          {status === "APPROVED" && isOngoing && (
            <DropdownMenuItem onClick={() => setPartialCancelOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Remaining Days
            </DropdownMenuItem>
          )}

          {/* Full Cancel - For pending/approved leaves that haven't started */}
          {(status === "PENDING" || status === "SUBMITTED" || (status === "APPROVED" && !hasStarted)) && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                // This would trigger the full cancel modal/action
                // Implement full cancellation separately
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Leave Request
            </DropdownMenuItem>
          )}

          {/* Fitness Certificate Upload - For ML >7 days */}
          {needsFitnessCert && status === "APPROVED" && hasEnded && (
            <DropdownMenuItem
              onClick={() => {
                // Navigate to certificate upload
                window.location.href = `/leaves/${leaveId}?action=upload-fitness`;
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Fitness Certificate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <ExtensionRequestModal
        leaveId={leaveId}
        endDate={endDate}
        open={extensionOpen}
        onOpenChange={setExtensionOpen}
      />

      <ShortenLeaveModal
        leaveId={leaveId}
        endDate={endDate}
        open={shortenOpen}
        onOpenChange={setShortenOpen}
      />

      <PartialCancelModal
        leaveId={leaveId}
        open={partialCancelOpen}
        onOpenChange={setPartialCancelOpen}
      />
    </>
  );
}

/**
 * Quick action buttons for leave details page
 * Shows prominent action buttons instead of dropdown menu
 */
export function LeaveQuickActions({
  leaveId,
  leaveType,
  startDate,
  endDate,
  workingDays,
  status,
  isOwner,
  needsFitnessCert = false,
}: LeaveActionsMenuProps) {
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [shortenOpen, setShortenOpen] = useState(false);
  const [partialCancelOpen, setPartialCancelOpen] = useState(false);

  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const hasStarted = normalizedToday >= normalizedStart;
  const hasEnded = normalizedToday > normalizedEnd;
  const isOngoing = hasStarted && !hasEnded;

  if (!isOwner || status !== "APPROVED" || !isOngoing) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExtensionOpen(true)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Request Extension
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShortenOpen(true)}
        className="gap-2"
      >
        <Scissors className="h-4 w-4" />
        Shorten Leave
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setPartialCancelOpen(true)}
        className="gap-2"
      >
        <XCircle className="h-4 w-4" />
        Cancel Remaining
      </Button>

      {/* Modals */}
      <ExtensionRequestModal
        leaveId={leaveId}
        endDate={endDate}
        open={extensionOpen}
        onOpenChange={setExtensionOpen}
      />

      <ShortenLeaveModal
        leaveId={leaveId}
        endDate={endDate}
        open={shortenOpen}
        onOpenChange={setShortenOpen}
      />

      <PartialCancelModal
        leaveId={leaveId}
        open={partialCancelOpen}
        onOpenChange={setPartialCancelOpen}
      />
    </div>
  );
}
