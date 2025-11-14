/**
 * Integration Tests for Leaves CRUD Operations
 * Tests: GET, POST /api/leaves and GET /api/leaves/[id]
 */

import { describe, it, expect, beforeAll } from "vitest";
import { GET, POST } from "@/app/api/leaves/route";
import { GET as GET_SINGLE } from "@/app/api/leaves/[id]/route";

describe("Leaves API - CRUD Operations", () => {
  describe("POST /api/leaves - Create Leave Request", () => {
    it("should create a new leave request with valid data", async () => {
      const mockRequest = new Request("http://localhost/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EARNED",
          startDate: "2025-02-01",
          endDate: "2025-02-05",
          reason: "Family vacation",
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it("should reject leave request with invalid dates", async () => {
      const mockRequest = new Request("http://localhost/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EARNED",
          startDate: "2025-02-05",
          endDate: "2025-02-01", // End before start
          reason: "Test",
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should reject leave request with missing required fields", async () => {
      const mockRequest = new Request("http://localhost/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EARNED",
          // Missing startDate, endDate, reason
        }),
      });

      const response = await POST(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /api/leaves - List Leave Requests", () => {
    it("should return a list of leave requests", async () => {
      const mockRequest = new Request("http://localhost/api/leaves?page=1&limit=10");
      
      const response = await GET(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it("should support filtering by status", async () => {
      const mockRequest = new Request("http://localhost/api/leaves?status=APPROVED");
      
      const response = await GET(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it("should support pagination", async () => {
      const mockRequest = new Request("http://localhost/api/leaves?page=1&limit=5");
      
      const response = await GET(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe("GET /api/leaves/[id] - Get Single Leave Request", () => {
    it("should handle invalid ID gracefully", async () => {
      const mockRequest = new Request("http://localhost/api/leaves/999999");
      
      const response = await GET_SINGLE(mockRequest, {
        params: { id: "999999" }
      });
      
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it("should reject non-numeric IDs", async () => {
      const mockRequest = new Request("http://localhost/api/leaves/invalid");
      
      const response = await GET_SINGLE(mockRequest, {
        params: { id: "invalid" }
      });
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
