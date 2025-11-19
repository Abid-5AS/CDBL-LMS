export type ApprovalStep = {
  role: string;
  status: string;
  decidedByName?: string | null;
  decidedAt?: string | null;
  comment?: string | null;
};

export type HRApprovalItem = {
  id: string;
  type: string;
  start: string | null;
  end: string | null;
  requestedDays: number;
  reason: string;
  status: string;
  approvals: ApprovalStep[];
  currentStageIndex: number;
  requestedById?: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
};
