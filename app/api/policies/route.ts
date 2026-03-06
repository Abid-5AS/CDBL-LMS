import { NextResponse } from "next/server";

// Reusing the same static data from frontend for consistency
// In a real app, this would come from a database (Prisma)
const policyData = {
  casualLeave: {
    title: "Casual Leave (CL)",
    code: "6.20",
    color: "text-blue-600",
    availability: "10 days per year",
    summary:
      "Short personal leave for errands or emergencies, limited to three consecutive working days per spell.",
    rules: [
      {
        title: "Maximum Duration",
        description:
          "CL is limited to a maximum of 3 (three) consecutive working days per spell.",
        type: "critical",
        policyRef: "6.20.a",
      },
      {
        title: "Annual Quota",
        description:
          "An employee can apply for a maximum of 10 (ten) days of CL in a calendar year.",
        type: "info",
        policyRef: "6.20.b",
      },
      {
        title: "No Advance Accrual",
        description:
          "CL cannot be accrued in advance. It must be utilized within the calendar year.",
        type: "warning",
        policyRef: "6.20.c",
      },
      {
        title: "Auto-Conversion to EL",
        description:
          "If more than 3 consecutive days are requested, the first 3 days will be deducted from CL balance and the remaining days will automatically be converted to Earned Leave (EL).",
        type: "info",
        policyRef: "6.20.d",
      },
      {
        title: "No Holiday Adjacency",
        description:
          "CL cannot be availed immediately before or after a public holiday, weekly holiday, or any other type of leave.",
        type: "critical",
        policyRef: "6.20.e",
      },
    ],
    examples: [
      {
        scenario: "Requesting 2 days CL",
        result: "Approved from CL balance (within 3-day limit)",
        valid: true,
      },
      {
        scenario: "Requesting 5 days CL",
        result: "First 3 days from CL, remaining 2 days auto-converted to EL",
        valid: true,
      },
      {
        scenario: "Requesting CL adjacent to a holiday",
        result: "Rejected - violates policy 6.20.e",
        valid: false,
      },
    ],
  },
  earnedLeave: {
    title: "Earned Leave (EL)",
    code: "6.21",
    color: "text-green-600",
    availability: "1.5 days per month (18 days/year)",
    summary:
      "Accrued leave that can be carried forward, with advance notice required for long breaks.",
    rules: [
      {
        title: "Accrual Rate",
        description:
          "EL is accrued at 1.5 days per month of service, totaling 18 days per year.",
        type: "info",
        policyRef: "6.21.a",
      },
      {
        title: "Notice Period",
        description:
          "For EL exceeding 10 consecutive days, at least 30 days advance notice is required.",
        type: "warning",
        policyRef: "6.21.b",
      },
      {
        title: "Maximum Accumulation",
        description:
          "EL can be accumulated up to a maximum of 60 days. Excess days overflow to Special EL bucket (up to 180 days total).",
        type: "info",
        policyRef: "6.21.c",
      },
      {
        title: "Encashment",
        description:
          "Employees can encash EL from the overflow balance (Special EL) only.",
        type: "info",
        policyRef: "6.21.d",
      },
    ],
    examples: [
      {
        scenario: "5 days EL with 2 weeks notice",
        result: "Approved (no 30-day notice required for ≤10 days)",
        valid: true,
      },
      {
        scenario: "15 days EL with 2 weeks notice",
        result: "Rejected - requires 30 days advance notice",
        valid: false,
      },
      {
        scenario: "EL balance reaches 65 days",
        result: "60 days in regular EL, 5 days overflow to Special EL",
        valid: true,
      },
    ],
  },
  medicalLeave: {
    title: "Medical Leave (ML)",
    code: "6.14",
    color: "text-red-600",
    availability: "14 days per year",
    summary:
      "Sick leave that needs medical and fitness certificates after certain durations, with overflow converting to EL.",
    rules: [
      {
        title: "Annual Quota",
        description:
          "Employees are entitled to 14 days of ML per calendar year.",
        type: "info",
        policyRef: "6.14.a",
      },
      {
        title: "Fitness Certificate (>7 days)",
        description:
          "ML exceeding 7 consecutive working days requires a fitness certificate for return to duty.",
        type: "critical",
        policyRef: "6.14.b",
      },
      {
        title: "Auto-Conversion (>14 days)",
        description:
          "If ML exceeds 14 days, the first 14 days are deducted from ML balance, and the excess is converted to EL/Special EL/Extraordinary Leave.",
        type: "warning",
        policyRef: "6.21.c",
      },
      {
        title: "Return to Duty",
        description:
          "Return to duty is blocked until the fitness certificate is approved by HR Admin → HR Head → CEO.",
        type: "critical",
        policyRef: "6.14.c",
      },
    ],
    examples: [
      {
        scenario: "3 days ML for flu",
        result: "Approved from ML balance, no certificate needed",
        valid: true,
      },
      {
        scenario: "10 days ML for surgery",
        result: "Approved, fitness certificate required before return",
        valid: true,
      },
      {
        scenario: "20 days ML",
        result: "First 14 days from ML, remaining 6 days from EL/Special",
        valid: true,
      },
    ],
  },
  maternityLeave: {
    title: "Maternity Leave",
    code: "6.15",
    color: "text-pink-600",
    availability: "90 days (with pay)",
    summary:
      "Ninety days of protected leave split around delivery with strict notice and no cancellation once approved.",
    rules: [
      {
        title: "Duration",
        description:
          "Female employees are entitled to 90 days of paid maternity leave.",
        type: "info",
        policyRef: "6.15.a",
      },
      {
        title: "Advance Notice",
        description:
          "At least 30 days advance notice should be given before the expected delivery date.",
        type: "warning",
        policyRef: "6.15.b",
      },
      {
        title: "Cannot Be Cancelled",
        description:
          "Maternity leave, once approved, cannot be cancelled or modified.",
        type: "critical",
        policyRef: "6.15.c",
      },
    ],
    examples: [
      {
        scenario: "Request 90 days maternity leave with 45 days notice",
        result: "Approved",
        valid: true,
      },
      {
        scenario: "Attempt to cancel maternity leave",
        result: "Rejected - maternity leave cannot be cancelled",
        valid: false,
      },
    ],
  },
  paternityLeave: {
    title: "Paternity Leave",
    code: "6.16",
    color: "text-indigo-600",
    availability: "7 days (with pay)",
    summary:
      "Seven days of partner leave to be used within thirty days of the child's birth.",
    rules: [
      {
        title: "Duration",
        description:
          "Male employees are entitled to 7 days of paid paternity leave.",
        type: "info",
        policyRef: "6.16.a",
      },
      {
        title: "Timing",
        description:
          "Paternity leave must be availed within 30 days of the child's birth.",
        type: "warning",
        policyRef: "6.16.b",
      },
    ],
    examples: [
      {
        scenario: "Request 7 days paternity leave within 2 weeks of birth",
        result: "Approved",
        valid: true,
      },
    ],
  },
};

export async function GET() {
  const policies = Object.values(policyData);
  return NextResponse.json({
    success: true,
    data: policies,
  });
}

export const dynamic = "force-dynamic";
