// Vitest setup file for Node.js environment tests
// Mocks date-fns-tz to avoid ESM import issues
import { vi } from "vitest";

// Mock date-fns-tz
vi.mock("date-fns-tz", () => ({
  utcToZonedTime: (date: Date, timeZone: string) => {
    // Simple implementation that returns the date as-is
    // This is sufficient for test purposes
    return date;
  },
  zonedTimeToUtc: (date: Date, timeZone: string) => {
    return date;
  },
  getTimezoneOffset: (timeZone: string) => 0,
}));
