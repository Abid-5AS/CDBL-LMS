/**
 * Custom hook for managing leave action dialogs
 */

import { useState } from "react";

type DialogType = "approve" | "reject" | "forward" | "return" | "cancel";

export function useLeaveDialogs() {
  const [currentLeaveId, setCurrentLeaveId] = useState<number | null>(null);
  const [currentLeaveInfo, setCurrentLeaveInfo] = useState({ type: "", name: "" });
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const openDialog = (
    leaveId: number,
    action: DialogType,
    leaveType: string,
    employeeName: string
  ) => {
    setCurrentLeaveId(leaveId);
    setCurrentLeaveInfo({ type: leaveType, name: employeeName });

    switch (action) {
      case "approve":
        setApproveDialogOpen(true);
        break;
      case "reject":
        setRejectDialogOpen(true);
        break;
      case "forward":
        setForwardDialogOpen(true);
        break;
      case "return":
        setReturnDialogOpen(true);
        break;
      case "cancel":
        setCancelDialogOpen(true);
        break;
    }
  };

  const closeAllDialogs = () => {
    setApproveDialogOpen(false);
    setRejectDialogOpen(false);
    setReturnDialogOpen(false);
    setForwardDialogOpen(false);
    setCancelDialogOpen(false);
    setCurrentLeaveId(null);
  };

  return {
    currentLeaveId,
    currentLeaveInfo,
    dialogs: {
      approve: { open: approveDialogOpen, setOpen: setApproveDialogOpen },
      reject: { open: rejectDialogOpen, setOpen: setRejectDialogOpen },
      return: { open: returnDialogOpen, setOpen: setReturnDialogOpen },
      forward: { open: forwardDialogOpen, setOpen: setForwardDialogOpen },
      cancel: { open: cancelDialogOpen, setOpen: setCancelDialogOpen },
    },
    openDialog,
    closeAllDialogs,
  };
}
