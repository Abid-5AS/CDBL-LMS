import { describe, it, expect } from "vitest";
import { countWorkingDaysSync } from "@/lib/working-days";
import { normalizeToDhakaMidnight, isWeekendBD } from "@/lib/date-utils";
import type { Holiday } from "@/lib/date-utils";
import { violatesCasualLeaveSideTouch } from "@/lib/leave-validation";

describe("lib/working-days", () => {
  describe("countWorkingDaysSync()", () => {
    it("should return 0 for invalid date range", () => {
      expect(countWorkingDaysSync(undefined, undefined)).toBe(0);
      const start = new Date("2024-01-15");
      const end = new Date("2024-01-10"); // end before start
      expect(countWorkingDaysSync(start, end)).toBe(0);
    });

    it("should count working days excluding weekends", () => {
      // Sunday to Thursday (5 working days)
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-11")); // Thursday
      expect(countWorkingDaysSync(start, end)).toBe(5);
    });

    it("should exclude Friday and Saturday", () => {
      // Sunday to Saturday (should exclude Fri, Sat)
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-13")); // Saturday
      // Sun, Mon, Tue, Wed, Thu = 5 working days (Fri, Sat excluded)
      expect(countWorkingDaysSync(start, end)).toBe(5);
    });

    it("should exclude holidays", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-11")); // Thursday
      const holidays: Holiday[] = [
        { date: "2024-01-09", name: "Test Holiday" }, // Tuesday
      ];
      // Should be 4 instead of 5 (Tuesday excluded)
      expect(countWorkingDaysSync(start, end, holidays)).toBe(4);
    });

    it("should exclude both weekends and holidays", () => {
      const start = normalizeToDhakaMidnight(new Date("2024-01-07")); // Sunday
      const end = normalizeToDhakaMidnight(new Date("2024-01-13")); // Saturday
      const holidays: Holiday[] = [
        { date: "2024-01-08", name: "Monday Holiday" },
      ];
      // Sun, Tue, Wed, Thu = 4 (Mon holiday excluded, Fri/Sat weekend excluded)
      expect(countWorkingDaysSync(start, end, holidays)).toBe(4);
    });

    it("should handle single day correctly", () => {
      const date = normalizeToDhakaMidnight(new Date("2024-01-08")); // Monday
      expect(countWorkingDaysSync(date, date)).toBe(1);
    });

    it("should use Dhaka timezone normalization", () => {
      // Test that dates are normalized to Dhaka midnight
      const start = new Date("2024-01-08T00:30:00+06:00");
      const end = new Date("2024-01-08T23:30:00+06:00");
      // Should normalize to same day in Dhaka timezone
      expect(countWorkingDaysSync(start, end)).toBe(1);
    });
  });

  describe("isWeekendBD timezone handling", () => {
    it("should treat Dhaka Friday correctly regardless of system timezone", () => {
      const dhakaFriday = new Date("2025-01-02T18:00:00.000Z"); // 00:00 Friday in Dhaka
      expect(isWeekendBD(dhakaFriday)).toBe(true);
    });
  });

  describe("Casual Leave side-touch enforcement", () => {
    it("flags when start date falls on a Friday", async () => {
      const start = new Date("2025-01-03T09:00:00+06:00"); // Friday
      const end = new Date("2025-01-05T09:00:00+06:00"); // Sunday

      await expect(
        violatesCasualLeaveSideTouch(start, end, { holidays: [] })
      ).resolves.toBe(true);
    });

    it("flags when range touches holiday on adjacent day", async () => {
      const start = new Date("2025-02-18T09:00:00+06:00"); // Tuesday
      const end = new Date("2025-02-19T09:00:00+06:00"); // Wednesday

      await expect(
        violatesCasualLeaveSideTouch(start, end, {
          holidays: [
            { date: "2025-02-17", name: "Mock Holiday" },
          ],
        })
      ).resolves.toBe(true);
    });

    it("allows range with no adjacent weekends or holidays", async () => {
      const start = new Date("2025-03-03T09:00:00+06:00"); // Monday
      const end = new Date("2025-03-04T09:00:00+06:00"); // Tuesday

      await expect(
        violatesCasualLeaveSideTouch(start, end, { holidays: [] })
      ).resolves.toBe(false);
    });
  });
});

