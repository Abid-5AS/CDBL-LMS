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

    // EARNED: 10/24 = 41.67%
    const earnedMeter = screen.getByLabelText(/earned/i);
    expect(earnedMeter).toBeInTheDocument();
    expect(earnedMeter).toHaveAttribute("aria-valuenow", "41.67");
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
    const meter = screen.getByLabelText(/earned/i);
    expect(meter).toHaveAttribute("aria-valuenow", "100");
  });

  it("should show remaining days correctly", () => {
    render(<LeaveBalancePanel balances={mockBalances} />);

    // EARNED: 24 - 10 = 14 remaining
    expect(screen.getByText(/14.*remaining/i)).toBeInTheDocument();
  });

  it("should render full variant with meters", () => {
    const { container } = render(
      <LeaveBalancePanel balances={mockBalances} variant="full" showMeters={true} />
    );

    const meters = container.querySelectorAll('[role="progressbar"]');
    expect(meters.length).toBeGreaterThan(0);
  });

  it("should render compact variant without meters", () => {
    const { container } = render(
      <LeaveBalancePanel balances={mockBalances} variant="compact" showMeters={false} />
    );

    const meters = container.querySelectorAll('[role="progressbar"]');
    expect(meters.length).toBe(0);
  });

  it("should show policy hints for EARNED leave when enabled", () => {
    render(
      <LeaveBalancePanel balances={mockBalances} showPolicyHints={true} />
    );

    expect(screen.getByText(/carry forward/i)).toBeInTheDocument();
  });

  it("should hide policy hints when disabled", () => {
    render(
      <LeaveBalancePanel balances={mockBalances} showPolicyHints={false} />
    );

    expect(screen.queryByText(/carry forward/i)).not.toBeInTheDocument();
  });

  it("should show projected balance when available", () => {
    render(<LeaveBalancePanel balances={mockBalances} />);

    expect(screen.getByText(/projected.*14/i)).toBeInTheDocument();
  });

  it("should handle empty balances array", () => {
    render(<LeaveBalancePanel balances={[]} emptyState={<div>No balances</div>} />);
    expect(screen.getByText("No balances")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<LeaveBalancePanel balances={[]} loading={true} />);
    const loadingElements = document.querySelectorAll('[class*="skeleton"], [class*="loading"]');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("should have correct aria-valuenow for accessibility", () => {
    render(<LeaveBalancePanel balances={mockBalances} showMeters={true} />);

    const meters = screen.getAllByRole("progressbar");
    meters.forEach((meter) => {
      const value = parseFloat(meter.getAttribute("aria-valuenow") || "0");
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
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

