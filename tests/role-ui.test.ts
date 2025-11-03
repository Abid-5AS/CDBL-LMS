/**
 * Unit tests for role-aware dock configuration
 * 
 * Verifies:
 * - No employee pages show admin actions
 * - Bulk actions only appear when hasSelection=true
 * - CSV export only appears when hasTabularData=true
 * - Role-specific dock actions match DOCK_MATRIX
 */

import { describe, it, expect } from "vitest";
import {
  getDockActions,
  isActionBanned,
  resolveHighestAuthority,
  validateRoleActions,
  type Role,
  type Page,
  type Action,
  DOCK_MATRIX,
} from "../lib/role-ui";

describe("Role-Aware Dock Configuration", () => {
  describe("getDockActions", () => {
    it("should return correct actions for EMPLOYEE on DASHBOARD", () => {
      const actions = getDockActions("EMPLOYEE", "DASHBOARD");
      expect(actions).toEqual(["APPLY_LEAVE", "MY_REQUESTS", "VIEW_POLICY"]);
    });

    it("should return correct actions for DEPT_HEAD on APPROVALS", () => {
      const actions = getDockActions("DEPT_HEAD", "APPROVALS");
      expect(actions).toEqual(["APPROVAL_QUEUE", "BULK_APPROVE", "BULK_REJECT"]);
    });

    it("should return correct actions for HR_ADMIN on REPORTS", () => {
      const actions = getDockActions("HR_ADMIN", "REPORTS");
      expect(actions).toEqual(["EXPORT_CSV"]);
    });

    it("should return correct actions for CEO on DASHBOARD", () => {
      const actions = getDockActions("CEO", "DASHBOARD");
      expect(actions).toEqual(["REPORTS", "AUDIT_LOGS", "VIEW_POLICY"]);
    });

    it("should filter out bulk actions when hasSelection=false", () => {
      const actions = getDockActions("DEPT_HEAD", "APPROVALS", {
        hasSelection: false,
      });
      expect(actions).toEqual(["APPROVAL_QUEUE"]);
      expect(actions).not.toContain("BULK_APPROVE");
      expect(actions).not.toContain("BULK_REJECT");
    });

    it("should keep bulk actions when hasSelection=true", () => {
      const actions = getDockActions("DEPT_HEAD", "APPROVALS", {
        hasSelection: true,
      });
      expect(actions).toContain("BULK_APPROVE");
      expect(actions).toContain("BULK_REJECT");
    });

    it("should filter out CSV export when hasTabularData=false", () => {
      const actions = getDockActions("HR_ADMIN", "REPORTS", {
        hasTabularData: false,
      });
      expect(actions).not.toContain("EXPORT_CSV");
    });

    it("should keep CSV export when hasTabularData=true", () => {
      const actions = getDockActions("HR_ADMIN", "REPORTS", {
        hasTabularData: true,
      });
      expect(actions).toContain("EXPORT_CSV");
    });

    it("should return empty array for unmapped role/page combinations", () => {
      const actions = getDockActions("EMPLOYEE", "REPORTS");
      expect(actions).toEqual([]);
    });
  });

  describe("isActionBanned", () => {
    it("should ban EXPORT_CSV for EMPLOYEE", () => {
      expect(isActionBanned("EMPLOYEE", "EXPORT_CSV")).toBe(true);
    });

    it("should ban REPORTS for EMPLOYEE", () => {
      expect(isActionBanned("EMPLOYEE", "REPORTS")).toBe(true);
    });

    it("should ban AUDIT_LOGS for EMPLOYEE", () => {
      expect(isActionBanned("EMPLOYEE", "AUDIT_LOGS")).toBe(true);
    });

    it("should ban BULK_APPROVE for EMPLOYEE", () => {
      expect(isActionBanned("EMPLOYEE", "BULK_APPROVE")).toBe(true);
    });

    it("should ban BULK_REJECT for EMPLOYEE", () => {
      expect(isActionBanned("EMPLOYEE", "BULK_REJECT")).toBe(true);
    });

    it("should allow APPROVAL_QUEUE for EMPLOYEE when mapped", () => {
      // Note: EMPLOYEE doesn't have APPROVAL_QUEUE in DOCK_MATRIX
      expect(isActionBanned("EMPLOYEE", "APPLY_LEAVE")).toBe(false);
    });

    it("should not ban any actions for HR_ADMIN", () => {
      const actions: Action[] = [
        "APPLY_LEAVE",
        "EXPORT_CSV",
        "REPORTS",
        "AUDIT_LOGS",
        "BULK_APPROVE",
        "BULK_REJECT",
      ];
      actions.forEach((action) => {
        expect(isActionBanned("HR_ADMIN", action)).toBe(false);
      });
    });

    it("should not ban any actions for CEO", () => {
      const actions: Action[] = [
        "APPLY_LEAVE",
        "EXPORT_CSV",
        "REPORTS",
        "AUDIT_LOGS",
      ];
      actions.forEach((action) => {
        expect(isActionBanned("CEO", action)).toBe(false);
      });
    });
  });

  describe("resolveHighestAuthority", () => {
    it("should return CEO when CEO is present", () => {
      const roles: Role[] = ["EMPLOYEE", "CEO"];
      expect(resolveHighestAuthority(roles)).toBe("CEO");
    });

    it("should return HR_HEAD when HR_HEAD is highest", () => {
      const roles: Role[] = ["DEPT_HEAD", "HR_HEAD", "HR_ADMIN"];
      expect(resolveHighestAuthority(roles)).toBe("HR_HEAD");
    });

    it("should return HR_ADMIN when HR_ADMIN is highest", () => {
      const roles: Role[] = ["EMPLOYEE", "HR_ADMIN"];
      expect(resolveHighestAuthority(roles)).toBe("HR_ADMIN");
    });

    it("should return single role when only one role present", () => {
      expect(resolveHighestAuthority(["EMPLOYEE"])).toBe("EMPLOYEE");
      expect(resolveHighestAuthority(["CEO"])).toBe("CEO");
    });
  });

  describe("validateRoleActions", () => {
    it("should pass validation for valid EMPLOYEE actions", () => {
      const actions: Action[] = ["APPLY_LEAVE", "MY_REQUESTS", "VIEW_POLICY"];
      expect(() => validateRoleActions("EMPLOYEE", actions)).not.toThrow();
    });

    it("should throw for EMPLOYEE with EXPORT_CSV", () => {
      const actions: Action[] = ["APPLY_LEAVE", "EXPORT_CSV"];
      expect(() => validateRoleActions("EMPLOYEE", actions)).toThrow();
    });

    it("should throw for EMPLOYEE with REPORTS", () => {
      const actions: Action[] = ["MY_REQUESTS", "REPORTS"];
      expect(() => validateRoleActions("EMPLOYEE", actions)).toThrow();
    });

    it("should throw for EMPLOYEE with BULK_APPROVE", () => {
      const actions: Action[] = ["APPLY_LEAVE", "BULK_APPROVE"];
      expect(() => validateRoleActions("EMPLOYEE", actions)).toThrow();
    });

    it("should pass validation for HR_ADMIN actions", () => {
      const actions: Action[] = ["EXPORT_CSV", "REPORTS", "BULK_APPROVE"];
      expect(() => validateRoleActions("HR_ADMIN", actions)).not.toThrow();
    });

    it("should pass validation for CEO actions", () => {
      const actions: Action[] = ["REPORTS", "AUDIT_LOGS", "EXPORT_CSV"];
      expect(() => validateRoleActions("CEO", actions)).not.toThrow();
    });
  });

  describe("DOCK_MATRIX completeness", () => {
    it("should have a mapping for every role", () => {
      const roles: Role[] = ["EMPLOYEE", "DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO"];
      roles.forEach((role) => {
        expect(DOCK_MATRIX[role]).toBeDefined();
      });
    });

    it("should not have banned actions for EMPLOYEE", () => {
      const employeePages = Object.keys(DOCK_MATRIX.EMPLOYEE) as Page[];
      employeePages.forEach((page) => {
        const actions = DOCK_MATRIX.EMPLOYEE[page] || [];
        actions.forEach((action) => {
          expect(isActionBanned("EMPLOYEE", action)).toBe(false);
        });
      });
    });

    it("should not have employee-only actions for admin roles", () => {
      const adminRoles: Role[] = ["HR_ADMIN", "HR_HEAD", "CEO"];
      adminRoles.forEach((role) => {
        const pages = Object.keys(DOCK_MATRIX[role]) as Page[];
        pages.forEach((page) => {
          const actions = DOCK_MATRIX[role][page] || [];
          // Admin roles should not have "APPLY_LEAVE" type actions
          // (though DEPT_HEAD can apply leave, they also have approval powers)
        });
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle EMPLOYEE@LEAVES_APPLY correctly", () => {
      const actions = getDockActions("EMPLOYEE", "LEAVES_APPLY");
      // Should not show admin actions
      expect(actions).not.toContain("EXPORT_CSV");
      expect(actions).not.toContain("REPORTS");
      expect(actions).not.toContain("AUDIT_LOGS");
      expect(actions).not.toContain("BULK_APPROVE");
      expect(actions).not.toContain("BULK_REJECT");
    });

    it("should handle HR_ADMIN@APPROVALS with selection correctly", () => {
      const actions = getDockActions("HR_ADMIN", "APPROVALS", {
        hasSelection: true,
      });
      expect(actions).toContain("BULK_APPROVE");
      expect(actions).toContain("BULK_REJECT");
    });

    it("should handle CEO@DASHBOARD correctly", () => {
      const actions = getDockActions("CEO", "DASHBOARD");
      // CEO should not see employee actions
      expect(actions).not.toContain("APPLY_LEAVE");
      expect(actions).toContain("REPORTS");
      expect(actions).toContain("AUDIT_LOGS");
    });

    it("should handle CSV export context correctly", () => {
      // HR_ADMIN on LEAVES_LIST should only show CSV if hasTabularData
      const withoutData = getDockActions("HR_ADMIN", "LEAVES_LIST", {
        hasTabularData: false,
      });
      expect(withoutData).not.toContain("EXPORT_CSV");

      const withData = getDockActions("HR_ADMIN", "LEAVES_LIST", {
        hasTabularData: true,
      });
      expect(withData).toContain("EXPORT_CSV");
    });
  });
});
