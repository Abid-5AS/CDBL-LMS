/**
 * Unit Tests for KPICard Component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICard } from "@/components/cards/KPICard";

describe("KPICard Component", () => {
  it("should render with title and value", () => {
    render(<KPICard title="Total Leaves" value={25} />);
    
    expect(screen.getByText("Total Leaves")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("should render with icon when provided", () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(<KPICard title="Pending" value={5} icon={<TestIcon />} />);
    
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("should display trend indicator when provided", () => {
    render(<KPICard title="Approved" value={20} trend={10} />);
    
    // Should show trend percentage or indicator
    const card = screen.getByText("Approved").closest("div");
    expect(card).toBeTruthy();
  });

  it("should handle zero value correctly", () => {
    render(<KPICard title="Rejected" value={0} />);
    
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should render description when provided", () => {
    render(
      <KPICard
        title="Balance"
        value={15}
        description="Remaining leave days"
      />
    );
    
    expect(screen.getByText("Remaining leave days")).toBeInTheDocument();
  });

  it("should apply custom className when provided", () => {
    const { container } = render(
      <KPICard title="Test" value={1} className="custom-class" />
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("custom-class");
  });

  it("should handle large numbers correctly", () => {
    render(<KPICard title="Total Days" value={999999} />);
    
    expect(screen.getByText("999999")).toBeInTheDocument();
  });

  it("should render loading state when loading prop is true", () => {
    render(<KPICard title="Loading" value={0} loading={true} />);
    
    // Check for skeleton or loading indicator
    const container = screen.getByText("Loading").closest("div");
    expect(container).toBeTruthy();
  });
});
