import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "@/components/shared/QuickActions";
import { Plus, FileText, Calendar } from "lucide-react";

describe("QuickActions Component", () => {
  const mockActions = [
    {
      label: "New Request",
      icon: Plus,
      href: "/leaves/new",
      variant: "default" as const,
    },
    {
      label: "View History",
      icon: FileText,
      href: "/leaves/history",
      variant: "outline" as const,
    },
    {
      label: "Calendar",
      icon: Calendar,
      onClick: vi.fn(),
      variant: "outline" as const,
    },
  ];

  it("should render actions in buttons variant", () => {
    render(<QuickActions actions={mockActions} variant="buttons" />);

    expect(screen.getByText("New Request")).toBeInTheDocument();
    expect(screen.getByText("View History")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("should render actions in card variant with title", () => {
    render(
      <QuickActions
        actions={mockActions}
        variant="card"
        title="Quick Actions"
      />
    );

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("New Request")).toBeInTheDocument();
  });

  it("should render actions in dropdown variant", () => {
    render(<QuickActions actions={mockActions} variant="dropdown" />);

    // Dropdown trigger should be present
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should render action with badge", () => {
    const actionsWithBadge = [
      {
        label: "Pending Approvals",
        icon: FileText,
        href: "/approvals",
        badge: 5,
      },
    ];

    render(<QuickActions actions={actionsWithBadge} variant="card" />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should handle compact mode", () => {
    const { container } = render(
      <QuickActions actions={mockActions} variant="card" compact={true} />
    );

    expect(container.querySelector('[class*="min-w-[120px]"]')).toBeTruthy();
  });
});


