/**
 * Utility: formatDate
 * 
 * Formats a date value using Bangladesh (en-GB) date format (DD/MM/YYYY).
 * 
 * @param value - Date, string, number, null, or undefined
 * @param fallback - Fallback string if value is invalid (default: "—")
 * @returns Formatted date string or fallback
 */

const bdDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: Date | string | number | null | undefined, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return bdDateFormatter.format(date);
}

