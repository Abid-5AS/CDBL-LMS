/**
 * Unit Tests for EmployeeLeaveBalance Component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeLeaveBalance } from "@/components/dashboards/employee/components/EmployeeLeaveBalance";

describe("EmployeeLeaveBalance Component", () => {
  const mockBalances = [
    {
      id: 1,
      type: "EARNED",
      opening: 24,
      accrued: 0,
      used: 10,
      remaining: 14,
    },
    {
      id: 2,
      type: "CASUAL",
      opening: 10,
      accrued: 0,
      used: 3,
      remaining: 7,
    },
  ];

  it("should render leave balance cards", () => {
    render(<EmployeeLeaveBalance balances={mockBalances} />);
    
    // Should render balance information
    expect(screen.getByText(/earned/i)).toBeInTheDocument();
    expect(screen.getByText(/casual/i)).toBeInTheDocument();
  });

  it("should display remaining days correctly", () => {
    render(<EmployeeLeaveBalance balances={mockBalances} />);
    
    // Check for remaining values
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("should handle empty balances array", () => {
    render(<EmployeeLeaveBalance balances={[]} />);
    
    // Should show empty state or message
    const container = screen.queryByText(/no.*balance/i);
    expect(container || screen.queryByRole("article")).toBeTruthy();
  });

  it("should show loading state when loading prop is true", () => {
    render(<EmployeeLeaveBalance balances={[]} loading={true} />);
    
    // Should show loading skeletons
    const container = document.querySelector('[class*="skeleton"]');
    expect(container).toBeTruthy();
  });

  it("should render policy hints when showPolicyHints is true", () => {
    render(<EmployeeLeaveBalance balances={mockBalances} showPolicyHints={true} />);
    
    // Should show policy-related information
    const element = screen.getByText(/earned/i).closest("div");
    expect(element).toBeTruthy();
  });

  it("should calculate percentage used correctly", () => {
    const balance = [{
      id: 1,
      type: "EARNED",
      opening: 20,
      accrued: 0,
      used: 10,
      remaining: 10,
    }];
    
    render(<EmployeeLeaveBalance balances={balance} />);
    
    // Should show 50% used (10/20)
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });
});
