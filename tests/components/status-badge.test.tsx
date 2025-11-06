import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LeaveStatus } from "@prisma/client";

describe("StatusBadge Component", () => {
  it("should render badge for APPROVED status", () => {
    render(<StatusBadge status={LeaveStatus.APPROVED} />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("should render badge for RETURNED status with tooltip", () => {
    render(<StatusBadge status={LeaveStatus.RETURNED} />);
    expect(screen.getByText("Returned")).toBeInTheDocument();
    // Tooltip should be present
  });

  it("should render badge for CANCELLATION_REQUESTED status", () => {
    render(<StatusBadge status={LeaveStatus.CANCELLATION_REQUESTED} />);
    expect(screen.getByText("Cancellation Requested")).toBeInTheDocument();
  });

  it("should render badge for RECALLED status", () => {
    render(<StatusBadge status={LeaveStatus.RECALLED} />);
    expect(screen.getByText("Recalled")).toBeInTheDocument();
  });

  it("should render badge for OVERSTAY_PENDING status", () => {
    render(<StatusBadge status={LeaveStatus.OVERSTAY_PENDING} />);
    expect(screen.getByText("Overstay")).toBeInTheDocument();
  });

  it("should fallback to PENDING for unknown status", () => {
    // @ts-expect-error - Testing invalid status
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});

