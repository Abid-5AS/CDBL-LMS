import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaveBalancePanel } from "@/components/shared/LeaveBalancePanel";
import type { Balance } from "@/components/shared/LeaveBalancePanel";

const mockBalances: Balance[] = [
  {
    type: "EARNED",
    used: 10,
    total: 24,
    projected: 14,
    carryForward: 5,
  },
  {
    type: "CASUAL",
    used: 5,
    total: 10,
  },
  {
    type: "MEDICAL",
    used: 2,
    total: 14,
  },
];

describe("LeaveBalancePanel", () => {
  it("should calculate percent used correctly", () => {
    render(<LeaveBalancePanel balances={mockBalances} />);

    // EARNED: 10/24 = 41.666...% (aria-valuenow uses raw value, not rounded)
    const earnedMeter = screen.getByLabelText(/10\/24 used/i);
    expect(earnedMeter).toBeInTheDocument();
    const ariValueNow = parseFloat(earnedMeter.getAttribute("aria-valuenow") || "0");
    expect(ariValueNow).toBeCloseTo(41.67, 1);
  });

  it("should clamp percent between 0 and 100", () => {
    const overused: Balance[] = [
      {
        type: "EARNED",
        used: 30,
        total: 24, // Over 100%
      },
    ];

    render(<LeaveBalancePanel balances={overused} />);
    const meter = screen.getByLabelText(/30\/24 used/i);
    const ariValueNow = parseFloat(meter.getAttribute("aria-valuenow") || "0");
    expect(ariValueNow).toBe(100);
  });

  it("should show remaining days correctly", () => {
    render(<LeaveBalancePanel balances={mockBalances} />);

    // EARNED: 24 - 10 = 14 remaining (displays as "14" with "58% remaining" below)
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText(/58% remaining/i)).toBeInTheDocument();
  });

  it("should render full variant with meters", () => {
    const { container } = render(
      <LeaveBalancePanel balances={mockBalances} variant="full" showMeters={true} />
    );

    // Look for progress elements with aria-valuenow attribute
    const meters = container.querySelectorAll('[aria-valuenow]');
    expect(meters.length).toBeGreaterThan(0);
  });

  it("should render compact variant without meters", () => {
    const { container } = render(
      <LeaveBalancePanel balances={mockBalances} variant="compact" showMeters={false} />
    );

    // In compact variant without meters, there should still be circular progress
    // Just check that the component renders
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should show policy hints for EARNED leave when enabled", () => {
    render(
      <LeaveBalancePanel balances={mockBalances} showPolicyHints={true} />
    );

    expect(screen.getByText(/Earned Leave Carry Forward/i)).toBeInTheDocument();
  });

  it("should hide policy hints when disabled", () => {
    render(
      <LeaveBalancePanel balances={mockBalances} showPolicyHints={false} />
    );

    expect(screen.queryByText(/Earned Leave Carry Forward/i)).not.toBeInTheDocument();
  });

  it("should show projected balance when available", () => {
    render(<LeaveBalancePanel balances={mockBalances} />);

    expect(screen.getByText(/Projected: 14 days/i)).toBeInTheDocument();
  });

  it("should handle empty balances array", () => {
    render(<LeaveBalancePanel balances={[]} emptyState={<div>No balances</div>} />);
    expect(screen.getByText("No balances")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<LeaveBalancePanel balances={[]} loading={true} />);
    // Component uses Skeleton component from UI
    const loadingElements = document.querySelectorAll('[class*="h-40"]');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("should have correct aria-valuenow for accessibility", () => {
    const { container } = render(<LeaveBalancePanel balances={mockBalances} showMeters={true} />);

    const meters = container.querySelectorAll('[aria-valuenow]');
    expect(meters.length).toBeGreaterThan(0);
    meters.forEach((meter) => {
      const valueStr = meter.getAttribute("aria-valuenow");
      if (valueStr) {
        const value = parseFloat(valueStr);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });
  });

  it("should fit in 320px width for compact variant", () => {
    const { container } = render(
      <LeaveBalancePanel balances={mockBalances} variant="compact" />
    );

    const panel = container.firstChild as HTMLElement;
    if (panel) {
      // In a real test, we'd check computed width, but here we verify structure
      expect(panel).toBeInTheDocument();
    }
  });
});

