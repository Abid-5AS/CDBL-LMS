import { describe, it, expect } from "vitest";
import {
  getChainFor,
  isFinalApprover,
  canPerformAction,
  getNextRoleInChain,
  getStepForRole,
  MASTER_WORKFLOW_CHAIN,
  WORKFLOW_CHAINS
} from "@/lib/workflow";
import type { LeaveType } from "@/src/generated/prisma/client";

describe("lib/workflow", () => {
  describe("getChainFor()", () => {
    it("should return Master Chain for EMPLOYEE requester", () => {
      const chain = getChainFor("EARNED", "EMPLOYEE");
      expect(chain).toEqual(["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"]);
    });

    it("should return Sub-Chain for DEPT_HEAD requester", () => {
      const chain = getChainFor("EARNED", "DEPT_HEAD");
      expect(chain).toEqual(["HR_ADMIN", "HR_HEAD", "CEO"]);
    });

    it("should return Sub-Chain for HR_ADMIN requester", () => {
      const chain = getChainFor("EARNED", "HR_ADMIN");
      expect(chain).toEqual(["HR_HEAD", "CEO"]);
    });

    it("should return Sub-Chain for HR_HEAD requester", () => {
      const chain = getChainFor("EARNED", "HR_HEAD");
      expect(chain).toEqual(["CEO"]);
    });

    it("should return empty chain for CEO requester", () => {
      const chain = getChainFor("EARNED", "CEO");
      expect(chain).toEqual([]);
    });
  });

  describe("isFinalApprover()", () => {
    it("should identify CEO as final approver for standard flow", () => {
      expect(isFinalApprover("CEO", "EARNED", "EMPLOYEE")).toBe(true);
    });

    it("should identify DEPT_HEAD as NOT final approver for standard flow", () => {
      expect(isFinalApprover("DEPT_HEAD", "EARNED", "EMPLOYEE")).toBe(false);
    });

    it("should identify CEO as final approver for HR_HEAD request", () => {
      expect(isFinalApprover("CEO", "EARNED", "HR_HEAD")).toBe(true);
    });
  });

  describe("canPerformAction()", () => {
    it("should allow FORWARD for DEPT_HEAD (first approver)", () => {
      expect(canPerformAction("DEPT_HEAD", "FORWARD", "EARNED", "EMPLOYEE")).toBe(true);
    });

    it("should allow FORWARD for HR_ADMIN", () => {
      expect(canPerformAction("HR_ADMIN", "FORWARD", "EARNED", "EMPLOYEE")).toBe(true);
    });

    it("should NOT allow FORWARD for CEO (final approver)", () => {
      expect(canPerformAction("CEO", "FORWARD", "EARNED", "EMPLOYEE")).toBe(false);
    });

    it("should allow APPROVE only for final approver (CEO)", () => {
      expect(canPerformAction("CEO", "APPROVE", "EARNED", "EMPLOYEE")).toBe(true);
      expect(canPerformAction("DEPT_HEAD", "APPROVE", "EARNED", "EMPLOYEE")).toBe(false);
    });

    it("should allow REJECT/RETURN for any approver in chain", () => {
      expect(canPerformAction("DEPT_HEAD", "REJECT", "EARNED", "EMPLOYEE")).toBe(true);
      expect(canPerformAction("HR_ADMIN", "RETURN", "EARNED", "EMPLOYEE")).toBe(true);
    });
  });

  describe("getNextRoleInChain()", () => {
    it("should follow Master Chain sequence", () => {
      expect(getNextRoleInChain("DEPT_HEAD", "EARNED", "EMPLOYEE")).toBe("HR_ADMIN");
      expect(getNextRoleInChain("HR_ADMIN", "EARNED", "EMPLOYEE")).toBe("HR_HEAD");
      expect(getNextRoleInChain("HR_HEAD", "EARNED", "EMPLOYEE")).toBe("CEO");
    });

    it("should follow Sub-Chain sequence for DEPT_HEAD requester", () => {
      expect(getNextRoleInChain("HR_ADMIN", "EARNED", "DEPT_HEAD")).toBe("HR_HEAD");
    });
  });

  describe("getStepForRole()", () => {
    it("should return correct step numbers for EMPLOYEE request", () => {
      expect(getStepForRole("DEPT_HEAD", "EARNED", "EMPLOYEE")).toBe(1);
      expect(getStepForRole("HR_ADMIN", "EARNED", "EMPLOYEE")).toBe(2);
      expect(getStepForRole("HR_HEAD", "EARNED", "EMPLOYEE")).toBe(3);
      expect(getStepForRole("CEO", "EARNED", "EMPLOYEE")).toBe(4);
    });

    it("should return correct step numbers for DEPT_HEAD request", () => {
      expect(getStepForRole("HR_ADMIN", "EARNED", "DEPT_HEAD")).toBe(1);
      expect(getStepForRole("CEO", "EARNED", "DEPT_HEAD")).toBe(3);
    });
  });
});
