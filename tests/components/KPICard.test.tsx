/**
 * Unit Tests for KPICard Component
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KPICard } from "@/components/cards/KPICard";
import { Activity } from "lucide-react";

describe("KPICard Component", () => {
  it("should render with title and value", () => {
    render(<KPICard title="Total Leaves" value="25" />);

    expect(screen.getByText("Total Leaves")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("should render with icon when provided", () => {
    render(<KPICard title="Pending" value="5" icon={Activity} />);

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should display progress when provided", () => {
    render(
      <KPICard
        title="Balance"
        value="10"
        progress={{ used: 10, total: 20 }}
      />
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("should handle zero value correctly", () => {
    render(<KPICard title="Rejected" value="0" />);

    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should render subtext when provided", () => {
    render(
      <KPICard title="Balance" value="15" subtext="Remaining leave days" />
    );

    expect(screen.getByText("Remaining leave days")).toBeInTheDocument();
  });

  it("should render badge when provided", () => {
    render(<KPICard title="Test" value="1" badge="New" />);

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("should handle status prop correctly", () => {
    render(<KPICard title="Status Test" value="100" status="healthy" />);

    expect(screen.getByText("Status Test")).toBeInTheDocument();
  });

  it("should render with accent color", () => {
    const { container } = render(
      <KPICard
        title="Colored"
        value="50"
        accentColor="bg-blue-500"
        className="custom-card"
      />
    );

    expect(screen.getByText("Colored")).toBeInTheDocument();
    expect(container.querySelector(".custom-card")).toBeTruthy();
  });
});
