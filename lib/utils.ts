import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const bdDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: Date | string | number | null | undefined, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return bdDateFormatter.format(date);
}
