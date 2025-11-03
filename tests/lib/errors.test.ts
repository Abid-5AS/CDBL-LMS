import { describe, it, expect } from "vitest";
import { error, isValidErrorCode, getErrorMessage, generateTraceId } from "@/lib/errors";

describe("lib/errors", () => {
  describe("error()", () => {
    it("should create error with code and default message", () => {
      const result = error("unauthorized");
      
      expect(result.error).toBe("unauthorized");
      expect(result.message).toBe("You are not authorized to perform this action. Please log in.");
      expect(result.traceId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it("should create error with custom message", () => {
      const customMessage = "Custom error message";
      const result = error("unauthorized", customMessage);
      
      expect(result.error).toBe("unauthorized");
      expect(result.message).toBe(customMessage);
    });

    it("should create error with custom traceId", () => {
      const customTraceId = "custom-trace-123";
      const result = error("unauthorized", undefined, customTraceId);
      
      expect(result.traceId).toBe(customTraceId);
    });

    it("should include additional fields", () => {
      const result = error("el_insufficient_notice", undefined, undefined, {
        required: 5,
        provided: 3,
      });
      
      expect(result.error).toBe("el_insufficient_notice");
      expect(result.required).toBe(5);
      expect(result.provided).toBe(3);
    });

    it("should generate unique traceIds when not provided", () => {
      const result1 = error("unauthorized");
      const result2 = error("unauthorized");
      
      expect(result1.traceId).not.toBe(result2.traceId);
    });
  });

  describe("isValidErrorCode()", () => {
    it("should return true for valid error codes", () => {
      expect(isValidErrorCode("unauthorized")).toBe(true);
      expect(isValidErrorCode("el_insufficient_notice")).toBe(true);
      expect(isValidErrorCode("fitness_certificate_required")).toBe(true);
    });

    it("should return false for invalid error codes", () => {
      expect(isValidErrorCode("invalid_code")).toBe(false);
      expect(isValidErrorCode("unknown_error")).toBe(false);
    });
  });

  describe("getErrorMessage()", () => {
    it("should return default message for valid code", () => {
      expect(getErrorMessage("unauthorized")).toBe(
        "You are not authorized to perform this action. Please log in."
      );
      expect(getErrorMessage("el_insufficient_notice")).toBe(
        "Earned Leave requires at least 5 working days advance notice."
      );
    });

    it("should return fallback message for invalid code", () => {
      expect(getErrorMessage("invalid_code")).toBe("An error occurred. Please try again.");
    });
  });

  describe("generateTraceId()", () => {
    it("should generate unique trace IDs", () => {
      const id1 = generateTraceId();
      const id2 = generateTraceId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it("should generate UUID format trace IDs", () => {
      const id = generateTraceId();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });
});

