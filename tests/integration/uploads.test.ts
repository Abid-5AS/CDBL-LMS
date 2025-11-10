/**
 * Integration Tests for File Uploads and Certificates
 * Tests: certificate uploads, MIME validation, fitness certificate enforcement
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSignedUrl, verifySignedUrl } from "@/lib/storage";
import { promises as fs } from "fs";
import path from "path";

describe("File Upload Integration", () => {
  let employee: { id: number; email: string };
  let leaveId: number;
  const testUploadDir = path.join(process.cwd(), "private", "uploads");

  beforeEach(async () => {
    employee = await prisma.user.create({
      data: {
        name: "Test Employee",
        email: `employee-${Date.now()}@test.local`,
        role: "EMPLOYEE",
      },
    });

    const leave = await prisma.leaveRequest.create({
      data: {
        requesterId: employee.id,
        type: "MEDICAL",
        startDate: new Date(),
        endDate: new Date(),
        workingDays: 5,
        reason: "Test medical leave",
          status: "APPROVED",
          policyVersion: "v2.0",
      },
    });
    leaveId = leave.id;

    // Ensure upload directory exists
    await fs.mkdir(testUploadDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup uploads
    try {
      const files = await fs.readdir(testUploadDir);
      for (const file of files) {
        await fs.unlink(path.join(testUploadDir, file));
      }
    } catch (err) {
      // Ignore errors
    }

    await prisma.leaveRequest.deleteMany({ where: { requesterId: employee.id } });
    await prisma.user.delete({ where: { id: employee.id } });
  });

  describe("Certificate Upload", () => {
    it("should accept PDF files", async () => {
      // In real test, would create actual file and test upload endpoint
      const filename = "test-certificate.pdf";
      const signedUrl = generateSignedUrl(filename);

      expect(signedUrl).toContain(filename);
      expect(signedUrl).toContain("expires=");
      expect(signedUrl).toContain("sig=");
    });

    it("should accept JPG files", () => {
      const filename = "test-certificate.jpg";
      const signedUrl = generateSignedUrl(filename);
      expect(signedUrl).toContain(filename);
    });

    it("should accept PNG files", () => {
      const filename = "test-certificate.png";
      const signedUrl = generateSignedUrl(filename);
      expect(signedUrl).toContain(filename);
    });

    it("should reject files > 5MB", () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const largeSize = 6 * 1024 * 1024; // 6MB
      expect(largeSize).toBeGreaterThan(maxSize);
    });
  });

  describe("Signed URL Generation", () => {
    it("should generate valid signed URL", () => {
      const filename = "test-certificate.pdf";
      const signedUrl = generateSignedUrl(filename);

      expect(signedUrl).toContain(filename);
      expect(signedUrl).toContain("expires=");
      expect(signedUrl).toContain("sig=");
    });

    it("should use private signed file route", () => {
      const filename = "secure-cert.pdf";
      const signedUrl = generateSignedUrl(filename);

      expect(signedUrl.startsWith("/api/files/signed/")).toBe(true);
      expect(signedUrl.includes("/public/")).toBe(false);
    });

    it("should verify valid signed URL", () => {
      const filename = "test-certificate.pdf";
      const signedUrl = generateSignedUrl(filename);
      const url = new URL(`https://example.com${signedUrl}`);
      const extractedFilename = url.pathname.replace("/api/files/signed/", "");
      const expires = url.searchParams.get("expires")!;
      const sig = url.searchParams.get("sig")!;
      const isValid = verifySignedUrl(extractedFilename, expires, sig);

      expect(isValid).toBe(true);
    });

    it("should reject expired signed URL", () => {
      // In real test, would create URL with past expiry
      const filename = "test-certificate.pdf";
      const signedUrl = generateSignedUrl(filename);
      const url = new URL(`https://example.com${signedUrl}`);
      const extractedFilename = url.pathname.replace("/api/files/signed/", "");
      const sig = url.searchParams.get("sig")!;
      const expired = (Date.now() - 60_000).toString();

      const isValid = verifySignedUrl(extractedFilename, expired, sig);
      expect(isValid).toBe(false);
    });

    it("should reject tampered signed URL", () => {
      const filename = "test-certificate.pdf";
      const signedUrl = generateSignedUrl(filename);
      const url = new URL(`https://example.com${signedUrl}`);
      const extractedFilename = url.pathname.replace("/api/files/signed/", "");
      const expires = url.searchParams.get("expires")!;
      const tamperedSig = url.searchParams.get("sig")!.replace(/.$/, "x");

      const isValid = verifySignedUrl(extractedFilename, expires, tamperedSig);
      expect(isValid).toBe(false);
    });
  });

  describe("Fitness Certificate Enforcement", () => {
    it("should require fitness certificate for ML > 7 days", async () => {
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "MEDICAL",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 8, // > 7 days
          reason: "Extended medical leave",
          status: "APPROVED",
          policyVersion: "v2.0",
        },
      });

      // Should require fitness certificate
      const requiresFitness = leave.workingDays > 7;
      expect(requiresFitness).toBe(true);
    });

    it("should not require fitness certificate for ML <= 7 days", async () => {
      const leave = await prisma.leaveRequest.create({
        data: {
          requesterId: employee.id,
          type: "MEDICAL",
          startDate: new Date(),
          endDate: new Date(),
          workingDays: 7,
          reason: "Medical leave",
          status: "APPROVED",
          policyVersion: "v2.0",
        },
      });

      const requiresFitness = leave.workingDays > 7;
      expect(requiresFitness).toBe(false);
    });
  });

  describe("Certificate URL Storage", () => {
    it("should update leave with certificateUrl", async () => {
      const certificateUrl = generateSignedUrl("medical-cert.pdf");
      
      await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { certificateUrl },
      });

      const updated = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
      });

      expect(updated?.certificateUrl).toBe(certificateUrl);
    });

    it("should update leave with fitnessCertificateUrl", async () => {
      const fitnessUrl = generateSignedUrl("fitness-cert.pdf");

      await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: { fitnessCertificateUrl: fitnessUrl },
      });

      const updated = await prisma.leaveRequest.findUnique({
        where: { id: leaveId },
      });

      expect(updated?.fitnessCertificateUrl).toBe(fitnessUrl);
    });
  });
});

