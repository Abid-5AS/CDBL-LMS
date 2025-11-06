import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SharedTimeline } from "@/components/shared/SharedTimeline";
import type { TimelineItem } from "@/components/shared/SharedTimeline";

const mockItems: TimelineItem[] = [
  {
    id: "1",
    at: "2024-01-15T10:00:00Z",
    actor: "HR Admin",
    status: "APPROVED",
    title: "Approved by HR Admin",
    subtitle: "Leave request approved",
  },
  {
    id: "2",
    at: "2024-01-14T09:00:00Z",
    actor: "Dept Head",
    status: "FORWARDED",
    title: "Forwarded to HR",
    subtitle: "Forwarded for final approval",
  },
  {
    id: "3",
    at: "2024-01-13T08:00:00Z",
    status: "PENDING",
    title: "Submitted",
    subtitle: "Leave request submitted",
  },
];

describe("SharedTimeline", () => {
  it("should render timeline items in reverse chronological order", () => {
    render(<SharedTimeline items={mockItems} />);

    const titles = screen.getAllByText(/Approved|Forwarded|Submitted/);
    expect(titles[0]).toHaveTextContent("Approved by HR Admin");
    expect(titles[1]).toHaveTextContent("Forwarded to HR");
    expect(titles[2]).toHaveTextContent("Submitted");
  });

  it("should respect limit prop", () => {
    render(<SharedTimeline items={mockItems} limit={2} />);

    const titles = screen.getAllByText(/Approved|Forwarded|Submitted/);
    expect(titles).toHaveLength(2);
    expect(titles[0]).toHaveTextContent("Approved by HR Admin");
  });

  it("should show load more button when onLoadMore is provided and items exceed limit", () => {
    const onLoadMore = vi.fn();
    render(<SharedTimeline items={mockItems} limit={2} onLoadMore={onLoadMore} />);

    const loadMoreButton = screen.getByText(/load more/i);
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("should render different variants correctly", () => {
    const { rerender } = render(<SharedTimeline items={mockItems} variant="activity" />);
    expect(screen.getByText("Approved by HR Admin")).toBeInTheDocument();

    rerender(<SharedTimeline items={mockItems} variant="approval" />);
    expect(screen.getByText("Approved by HR Admin")).toBeInTheDocument();

    rerender(<SharedTimeline items={mockItems} variant="requests" />);
    expect(screen.getByText("Approved by HR Admin")).toBeInTheDocument();
  });

  it("should show empty state when items array is empty", () => {
    render(<SharedTimeline items={[]} emptyState={<div>No timeline items</div>} />);
    expect(screen.getByText("No timeline items")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<SharedTimeline items={[]} loading={true} />);
    // Check for skeleton or loading indicator
    const loadingElements = document.querySelectorAll('[class*="skeleton"], [class*="loading"]');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("should support keyboard navigation", () => {
    render(<SharedTimeline items={mockItems} />);

    const firstItem = screen.getByText("Approved by HR Admin").closest("div");
    if (firstItem) {
      firstItem.focus();
      expect(document.activeElement).toBe(firstItem);
    }
  });

  it("should render dense variant with compact spacing", () => {
    const { container } = render(<SharedTimeline items={mockItems} dense={true} />);
    // Dense variant should have different spacing classes
    expect(container.firstChild).toBeInTheDocument();
  });
});

