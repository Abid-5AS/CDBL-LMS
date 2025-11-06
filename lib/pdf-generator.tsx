import { PDFDocument } from "@/components/reports/PDFDocument";

type PDFDocumentProps = {
  title: string;
  duration: string;
  generatedAt: string;
  kpis: {
    pendingApprovals: number;
    approvedLeaves: number;
    avgApprovalTime: number;
    totalEmployees: number;
    utilizationRate: number;
  };
  charts: {
    monthlyTrend: Array<{ month: string; leaves: number }>;
    typeDistribution: Array<{ name: string; value: number }>;
    departmentSummary: Array<{ name: string; count: number }>;
  };
  leaves: Array<{
    requester: { name: string; email: string; department: string | null };
    type: string;
    startDate: Date | string;
    endDate: Date | string;
    workingDays: number;
    status: string;
  }>;
  filters: {
    department: string | null;
    leaveType: string | null;
  };
};

export function createPDFDocument(props: PDFDocumentProps) {
  // Guard against null/undefined props
  if (!props) {
    throw new Error("PDF document props are required");
  }

  // Validate required props
  if (!props.title || !props.duration || !props.generatedAt) {
    throw new Error("Missing required PDF document props");
  }

  // Use JSX directly since this is a .tsx file
  return (
    <PDFDocument
      title={props.title}
      duration={props.duration}
      generatedAt={props.generatedAt}
      kpis={props.kpis}
      charts={props.charts}
      leaves={props.leaves}
      filters={props.filters}
    />
  );
}

