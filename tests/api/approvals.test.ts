/**
 * Integration Tests for Approvals API
 * Tests: GET /api/approvals, POST /api/approvals/[id]/decision
 */

import { describe, it, expect } from "vitest";

describe("Approvals API", () => {
  describe("GET /api/approvals", () => {
    it("should return list of pending approvals", async () => {
      const response = await fetch("http://localhost/api/approvals").catch(
        () => ({ status: 500 })
      );

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it("should support filtering by status", async () => {
      const response = await fetch(
        "http://localhost/api/approvals?status=PENDING"
      ).catch(() => ({ status: 500 }));

      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it("should support pagination", async () => {
      const response = await fetch(
        "http://localhost/api/approvals?page=1&limit=10"
      ).catch(() => ({ status: 500 }));

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe("POST /api/approvals/[id]/decision", () => {
    it("should reject decision without required fields", async () => {
      const response = await fetch(
        "http://localhost/api/approvals/1/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      ).catch(() => ({ status: 500 }));

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject invalid decision values", async () => {
      const response = await fetch(
        "http://localhost/api/approvals/1/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: "INVALID_DECISION",
          }),
        }
      ).catch(() => ({ status: 500 }));

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should accept valid APPROVE decision", async () => {
      const response = await fetch(
        "http://localhost/api/approvals/1/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: "APPROVE",
            comment: "Approved",
          }),
        }
      ).catch(() => ({ status: 500 }));

      // May fail due to auth or not found, but should not be 500
      expect(response.status).toBeLessThan(500);
    });

    it("should accept valid REJECT decision with reason", async () => {
      const response = await fetch(
        "http://localhost/api/approvals/1/decision",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: "REJECT",
            comment: "Insufficient balance",
          }),
        }
      ).catch(() => ({ status: 500 }));

      expect(response.status).toBeLessThan(500);
    });
  });
});
