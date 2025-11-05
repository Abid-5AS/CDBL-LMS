import { describe, it, expect } from "vitest";
import {
  canManageSystemStructure,
  canViewAllRequests,
  canApprove,
  canCreateEmployee,
  canCancel,
  canReturn,
} from "@/lib/rbac";
import type { AppRole } from "@/lib/rbac";

describe("lib/rbac", () => {
  describe("canManageSystemStructure()", () => {
    it("should return true only for SYSTEM_ADMIN", () => {
      expect(canManageSystemStructure("SYSTEM_ADMIN")).toBe(true);
      expect(canManageSystemStructure("CEO")).toBe(false);
      expect(canManageSystemStructure("HR_HEAD")).toBe(false);
      expect(canManageSystemStructure("HR_ADMIN")).toBe(false);
      expect(canManageSystemStructure("DEPT_HEAD")).toBe(false);
      expect(canManageSystemStructure("EMPLOYEE")).toBe(false);
    });
  });

  describe("canViewAllRequests()", () => {
    it("should allow SYSTEM_ADMIN to view all requests", () => {
      expect(canViewAllRequests("SYSTEM_ADMIN")).toBe(true);
    });

    it("should allow HR roles to view all requests", () => {
      expect(canViewAllRequests("HR_ADMIN")).toBe(true);
      expect(canViewAllRequests("HR_HEAD")).toBe(true);
    });

    it("should allow DEPT_HEAD and CEO to view all requests", () => {
      expect(canViewAllRequests("DEPT_HEAD")).toBe(true);
      expect(canViewAllRequests("CEO")).toBe(true);
    });

    it("should not allow EMPLOYEE to view all requests", () => {
      expect(canViewAllRequests("EMPLOYEE")).toBe(false);
    });
  });

  describe("canApprove()", () => {
    it("should allow SYSTEM_ADMIN to approve", () => {
      expect(canApprove("SYSTEM_ADMIN")).toBe(true);
    });
  });

  describe("canCreateEmployee()", () => {
    it("should allow SYSTEM_ADMIN to create employees", () => {
      expect(canCreateEmployee("SYSTEM_ADMIN")).toBe(true);
    });
  });

  describe("canCancel()", () => {
    it("should allow SYSTEM_ADMIN to cancel any leave", () => {
      expect(canCancel("SYSTEM_ADMIN", false)).toBe(true);
      expect(canCancel("SYSTEM_ADMIN", true)).toBe(true);
    });
  });

  describe("canReturn()", () => {
    it("should allow SYSTEM_ADMIN to return requests", () => {
      expect(canReturn("SYSTEM_ADMIN")).toBe(true);
    });
  });
});


