export type LeaveRow = {
  id: string;
  type: "EL" | "CL" | "ML" | "EWP" | "EWO" | "MAT" | "PAT";
  start: string; // ISO
  end: string; // ISO
  requestedDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  updatedAt: string; // ISO
  // TODO later: userId, attachments, workflow, etc.
};

const _leaves: LeaveRow[] = [];

export function addLeave(row: LeaveRow) {
  _leaves.unshift(row);
}

export function listLeaves(): LeaveRow[] {
  return _leaves;
}
