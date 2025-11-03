import { describe, it, expect } from "vitest";
import {
  getChainFor,
  isFinalApprover,
  canPerformAction,
  getNextRoleInChain,
  getStepForRole,
  WORKFLOW_CHAINS,
} from "@/lib/workflow";
import type { LeaveType } from "@prisma/client";

describe("lib/workflow", () => {
  describe("getChainFor()", () => {
    it("should return correct chain for EARNED", () => {
      const chain = getChainFor("EARNED");
      expect(chain).toEqual(["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]);
    });

    it("should return correct chain for CASUAL (shorter chain)", () => {
      const chain = getChainFor("CASUAL");
      expect(chain).toEqual(["DEPT_HEAD"]);
    });

    it("should return correct chain for MEDICAL", () => {
      const chain = getChainFor("MEDICAL");
      expect(chain).toEqual(["HR_ADMIN", "DEPT_HEAD", "HR_HEAD", "CEO"]);
    });

    it("should return default chain for unknown type", () => {
      const chain = getChainFor("EXTRAWITHPAY" as LeaveType);
      expect(chain).toEqual(WORKFLOW_CHAINS.DEFAULT);
    });
  });

  describe("isFinalApprover()", () => {
    it("should return true for CEO in EARNED chain", () => {
      expect(isFinalApprover("CEO", "EARNED")).toBe(true);
    });

    it("should return false for DEPT_HEAD in EARNED chain", () => {
      expect(isFinalApprover("DEPT_HEAD", "EARNED")).toBe(false);
    });

    it("should return true for DEPT_HEAD in CASUAL chain (final approver)", () => {
      expect(isFinalApprover("DEPT_HEAD", "CASUAL")).toBe(true);
    });

    it("should return false for HR_ADMIN in CASUAL chain", () => {
      expect(isFinalApprover("HR_ADMIN", "CASUAL")).toBe(false);
    });
  });

  describe("canPerformAction()", () => {
    it("should allow FORWARD for intermediate approvers", () => {
      expect(canPerformAction("DEPT_HEAD", "FORWARD", "EARNED")).toBe(true);
      expect(canPerformAction("HR_HEAD", "FORWARD", "EARNED")).toBe(true);
    });

    it("should not allow FORWARD for final approver", () => {
      expect(canPerformAction("CEO", "FORWARD", "EARNED")).toBe(false);
      expect(canPerformAction("DEPT_HEAD", "FORWARD", "CASUAL")).toBe(false);
    });

    it("should allow APPROVE only for final approver", () => {
      expect(canPerformAction("CEO", "APPROVE", "EARNED")).toBe(true);
      expect(canPerformAction("DEPT_HEAD", "APPROVE", "CASUAL")).toBe(true);
      expect(canPerformAction("DEPT_HEAD", "APPROVE", "EARNED")).toBe(false);
    });

    it("should allow REJECT only for final approver", () => {
      expect(canPerformAction("CEO", "REJECT", "EARNED")).toBe(true);
      expect(canPerformAction("DEPT_HEAD", "REJECT", "CASUAL")).toBe(true);
      expect(canPerformAction("HR_HEAD", "REJECT", "EARNED")).toBe(false);
    });
  });

  describe("getNextRoleInChain()", () => {
    it("should return next role for intermediate approver", () => {
      expect(getNextRoleInChain("HR_ADMIN", "EARNED")).toBe("DEPT_HEAD");
      expect(getNextRoleInChain("DEPT_HEAD", "EARNED")).toBe("HR_HEAD");
    });

    it("should return null for final approver", () => {
      expect(getNextRoleInChain("CEO", "EARNED")).toBeNull();
      expect(getNextRoleInChain("DEPT_HEAD", "CASUAL")).toBeNull();
    });

    it("should return null for role not in chain", () => {
      expect(getNextRoleInChain("EMPLOYEE", "EARNED")).toBeNull();
    });
  });

  describe("getStepForRole()", () => {
    it("should return correct step numbers (1-indexed)", () => {
      expect(getStepForRole("HR_ADMIN", "EARNED")).toBe(1);
      expect(getStepForRole("DEPT_HEAD", "EARNED")).toBe(2);
      expect(getStepForRole("HR_HEAD", "EARNED")).toBe(3);
      expect(getStepForRole("CEO", "EARNED")).toBe(4);
    });

    it("should return 1 for DEPT_HEAD in CASUAL chain", () => {
      expect(getStepForRole("DEPT_HEAD", "CASUAL")).toBe(1);
    });

    it("should return 0 for role not in chain", () => {
      expect(getStepForRole("EMPLOYEE", "EARNED")).toBe(0);
    });
  });
});

