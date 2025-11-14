/**
 * Unit Tests for EmployeeLeaveBalance Component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmployeeLeaveBalance } from "@/components/dashboards/employee/components/EmployeeLeaveBalance";

describe("EmployeeLeaveBalance Component", () => {
  const mockBalanceData = {
    EARNED: 14,
    CASUAL: 7,
  };

  it("should render leave balance cards", () => {
    render(<EmployeeLeaveBalance balanceData={mockBalanceData} isLoading={false} />);

    // Should render balance information
    expect(screen.getByText(/earned leave/i)).toBeInTheDocument();
    expect(screen.getByText(/casual leave/i)).toBeInTheDocument();
  });

  it("should display remaining days correctly", () => {
    render(<EmployeeLeaveBalance balanceData={mockBalanceData} isLoading={false} />);

    // Check for balance values
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("should handle empty balances object", () => {
    render(<EmployeeLeaveBalance balanceData={{}} isLoading={false} />);

    // Should show empty state message
    expect(screen.getByText(/no balance information available/i)).toBeInTheDocument();
  });

  it("should show loading state when isLoading prop is true", () => {
    render(<EmployeeLeaveBalance balanceData={{}} isLoading={true} />);

    // Should show loading skeletons with animate-pulse class
    const container = document.querySelector('.animate-pulse');
    expect(container).toBeTruthy();
  });

  it("should display days available text", () => {
    render(<EmployeeLeaveBalance balanceData={mockBalanceData} isLoading={false} />);

    // Should show "days available" text for each balance
    expect(screen.getByText(/14 days available/i)).toBeInTheDocument();
    expect(screen.getByText(/7 days available/i)).toBeInTheDocument();
  });

  it("should render with multiple leave types", () => {
    const multipleTypes = {
      EARNED: 10,
      CASUAL: 5,
      MEDICAL: 8,
    };

    render(<EmployeeLeaveBalance balanceData={multipleTypes} isLoading={false} />);

    expect(screen.getByText(/earned leave/i)).toBeInTheDocument();
    expect(screen.getByText(/casual leave/i)).toBeInTheDocument();
    expect(screen.getByText(/medical leave/i)).toBeInTheDocument();
  });
});
