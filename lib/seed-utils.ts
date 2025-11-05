/**
 * Seed utility functions for generating realistic demo data
 * These functions ensure consistent, policy-aligned data generation
 */

import { LeaveType, LeaveStatus } from "@prisma/client";
import { normalizeToDhakaMidnight } from "./date-utils";

/**
 * Deterministic random number generator for consistent seeding
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

/**
 * Generate a random date within a year range (default: current year ± 1)
 */
export function randomDateWithin(
  yearRange: number = 1,
  rng: SeededRandom
): Date {
  const today = new Date();
  const currentYear = today.getFullYear();
  const startYear = currentYear - yearRange;
  const endYear = currentYear + yearRange;

  const startDate = new Date(startYear, 0, 1);
  const endDate = new Date(endYear, 11, 31);

  const timeDiff = endDate.getTime() - startDate.getTime();
  const randomTime = startDate.getTime() + rng.next() * timeDiff;

  return normalizeToDhakaMidnight(new Date(randomTime));
}

/**
 * Generate a random date in the past (within last 6 months)
 */
export function randomPastDate(
  maxDaysAgo: number = 180,
  rng: SeededRandom
): Date {
  const today = new Date();
  const daysAgo = rng.nextInt(1, maxDaysAgo);
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return normalizeToDhakaMidnight(date);
}

/**
 * Generate a random date in the future (within next month)
 */
export function randomFutureDate(
  maxDaysAhead: number = 30,
  rng: SeededRandom
): Date {
  const today = new Date();
  const daysAhead = rng.nextInt(1, maxDaysAhead);
  const date = new Date(today);
  date.setDate(date.getDate() + daysAhead);
  return normalizeToDhakaMidnight(date);
}

/**
 * Generate random duration (1-5 days by default, policy-aware)
 */
export function randomDuration(
  leaveType: LeaveType,
  rng: SeededRandom
): number {
  switch (leaveType) {
    case "CASUAL":
      return rng.nextInt(1, 3); // CL max 3 days
    case "EARNED":
      return rng.nextInt(1, 10); // EL can be longer
    case "MEDICAL":
      return rng.nextInt(1, 8); // ML varies
    default:
      return rng.nextInt(1, 5);
  }
}

/**
 * Generate random leave status with weighted distribution:
 * APPROVED (60%), PENDING (20%), REJECTED (10%), RETURNED (10%)
 */
export function randomStatus(rng: SeededRandom): LeaveStatus {
  const roll = rng.next();
  if (roll < 0.6) return "APPROVED";
  if (roll < 0.8) return "PENDING";
  if (roll < 0.9) return "REJECTED";
  if (roll < 0.95) return "RETURNED";
  if (roll < 0.97) return "CANCELLATION_REQUESTED";
  return "CANCELLED";
}

/**
 * Generate realistic reason based on leave type
 */
export function randomReason(leaveType: LeaveType, rng: SeededRandom): string {
  const reasons: Record<LeaveType, string[]> = {
    EARNED: [
      "Family vacation and personal time",
      "Family wedding celebration",
      "Personal errands and rest",
      "Family gathering and reunion",
      "Personal matters requiring attention",
      "Family event and celebration",
      "Rest and personal time off",
    ],
    CASUAL: [
      "Personal errands and appointments",
      "Family commitments",
      "Personal matters",
      "Urgent personal work",
      "Family event",
      "Personal appointments",
      "Short personal break",
    ],
    MEDICAL: [
      "Medical consultation and treatment",
      "Health check-up and follow-up",
      "Medical treatment and recovery",
      "Doctor's appointment and medication",
      "Health-related medical visit",
      "Medical examination and tests",
      "Sick leave for medical recovery",
    ],
    MATERNITY: [
      "Maternity leave for childbirth",
      "Maternity and childcare",
      "Maternity leave period",
    ],
    PATERNITY: [
      "Paternity leave for newborn",
      "Paternity and family support",
    ],
    STUDY: [
      "Study leave for professional development",
      "Educational course and training",
      "Study and examination period",
    ],
    SPECIAL_DISABILITY: [
      "Special disability leave",
      "Medical disability leave",
    ],
    QUARANTINE: [
      "Quarantine period as per medical advice",
      "Isolation as per health guidelines",
    ],
    EXTRAWITHPAY: [
      "Extra leave with pay as approved",
      "Special leave with pay",
    ],
    EXTRAWITHOUTPAY: [
      "Extra leave without pay",
      "Unpaid leave for personal reasons",
    ],
  };

  const options = reasons[leaveType] || ["Leave request"];
  return rng.pick(options);
}

/**
 * Generate realistic Bangladeshi names
 */
export function generateBangladeshiName(rng: SeededRandom): string {
  const firstNames = [
    "Ahmed",
    "Fatima",
    "Hasan",
    "Ayesha",
    "Rahman",
    "Khan",
    "Ali",
    "Begum",
    "Ibrahim",
    "Sultana",
    "Mahmud",
    "Noor",
    "Karim",
    "Jahan",
    "Hossain",
    "Chowdhury",
    "Islam",
    "Akter",
    "Uddin",
    "Parvin",
    "Miah",
    "Khatun",
    "Rashid",
    "Haque",
    "Alam",
    "Siddique",
    "Mallik",
    "Bhuiyan",
  ];

  const lastNames = [
    "Rahman",
    "Hossain",
    "Khan",
    "Ahmed",
    "Ali",
    "Islam",
    "Chowdhury",
    "Hasan",
    "Karim",
    "Uddin",
    "Miah",
    "Haque",
    "Alam",
    "Siddique",
    "Mallik",
    "Bhuiyan",
    "Begum",
    "Khatun",
    "Sultana",
    "Jahan",
  ];

  const firstName = rng.pick(firstNames);
  const lastName = rng.pick(lastNames);
  return `${firstName} ${lastName}`;
}

/**
 * Generate employee code based on role and department
 */
export function generateEmpCode(
  role: string,
  dept: string,
  index: number
): string {
  if (role === "SYSTEM_ADMIN") return "SA001";
  if (role === "CEO") return "CEO001";
  if (role === "HR_HEAD") return "HRH001";
  if (role === "HR_ADMIN") return `HRA${String(index).padStart(2, "0")}`;
  if (role === "DEPT_HEAD") {
    const deptCode = dept.substring(0, 2).toUpperCase();
    return `${deptCode}H001`;
  }
  const deptCode = dept.substring(0, 2).toUpperCase();
  return `${deptCode}${String(index).padStart(3, "0")}`;
}

/**
 * Generate email based on name, role, and department
 */
export function generateEmail(
  name: string,
  role: string,
  dept: string,
  index: number
): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, ".");
  if (role === "SYSTEM_ADMIN") return "sysadmin@cdbl.local";
  if (role === "CEO") return "ceo@cdbl.local";
  if (role === "HR_HEAD") return "hrhead@cdbl.local";
  if (role === "HR_ADMIN") return `hradmin${index}@cdbl.local`;
  if (role === "DEPT_HEAD") return `depthead.${dept.toLowerCase()}@cdbl.local`;
  return `${cleanName}${index}@cdbl.local`;
}



