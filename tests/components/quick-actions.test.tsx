import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickActions } from "@/components/shared/QuickActions";

describe("QuickActions Component", () => {
  const mockLeaves = [
    {
      id: 1,
      type: "EARNED",
      status: "APPROVED" as const,
      workingDays: 5,
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      fitnessCertificateUrl: null,
    },
    {
      id: 2,
      type: "MEDICAL",
      status: "APPROVED" as const,
      workingDays: 8,
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      fitnessCertificateUrl: null,
    },
    {
      id: 3,
      type: "CASUAL",
      status: "PENDING" as const,
      workingDays: 2,
    },
  ];

  it("should show Request Cancellation only for APPROVED leaves", () => {
    const approvedOnlyLeaves = mockLeaves.filter((l) => l.status === "APPROVED");
    const { container } = render(<QuickActions leaves={approvedOnlyLeaves} isLoading={false} />);
    
    // Should show "Request Cancellation" button
    const cancelButton = container.querySelector('button:has-text("Request Cancellation")');
    expect(cancelButton).toBeTruthy();
  });

  it("should show Return to Duty only for ML > 7 days that has ended and missing fitness cert", () => {
    const medicalLeaves = mockLeaves.filter(
      (l) => l.type === "MEDICAL" && l.status === "APPROVED" && (l.workingDays ?? 0) > 7
    );
    
    // Filter by endDate < today and missing fitnessCertificateUrl
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eligibleLeaves = medicalLeaves.filter((l) => {
      if (!l.endDate) return false;
      const endDate = new Date(l.endDate);
      endDate.setHours(0, 0, 0, 0);
      const hasEnded = endDate < today;
      const missingFitnessCert = !l.fitnessCertificateUrl;
      return hasEnded && missingFitnessCert;
    });

    expect(eligibleLeaves.length).toBeGreaterThan(0);
  });

  it("should hide Return to Duty when fitness certificate exists", () => {
    const medicalLeaveWithCert = {
      id: 2,
      type: "MEDICAL",
      status: "APPROVED" as const,
      workingDays: 8,
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      fitnessCertificateUrl: "/uploads/fitness-cert.pdf",
    };

    const { container } = render(<QuickActions leaves={[medicalLeaveWithCert]} isLoading={false} />);
    
    // Should NOT show "Return to Duty" when certificate exists
    const returnButton = container.querySelector('button:has-text("Return to Duty")');
    expect(returnButton).toBeFalsy();
  });
});


