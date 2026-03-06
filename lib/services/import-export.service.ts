import { prisma } from "@/lib/prisma";
import { LeaveType, LeaveStatus, Role } from "@/src/generated/prisma/client";
import { parse } from "papaparse";
import * as bcrypt from "bcryptjs";

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export interface EmployeeImportRow {
  name: string;
  email: string;
  empCode?: string;
  role?: string;
  department?: string;
  joinDate?: string;
}

export interface HolidayImportRow {
  date: string;
  name: string;
  isOptional?: string;
}

export interface BalanceImportRow {
  empCode: string;
  leaveType: string;
  year: number;
  opening: number;
  accrued?: number;
  used?: number;
}

export interface LeaveImportRow {
  employeeEmail: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  workingDays?: string;
}

/**
 * ImportExportService
 *
 * Handles bulk data import/export operations
 */
export class ImportExportService {
  /**
   * Parse CSV file
   */
  static parseCSV<T = any>(csvContent: string): T[] {
    const result = parse<T>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    return result.data;
  }

  /**
   * Import employees from CSV
   */
  static async importEmployees(
    csvContent: string,
    dryRun: boolean = false
  ): Promise<ImportResult> {
    const rows = this.parseCSV<EmployeeImportRow>(csvContent);
    const errors: { row: number; error: string }[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header and 0-index

      try {
        // Validate required fields
        if (!row.name || !row.email) {
          errors.push({
            row: rowNum,
            error: "Name and email are required",
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          errors.push({ row: rowNum, error: "Invalid email format" });
          continue;
        }

        // Validate role if provided
        const role = row.role?.toUpperCase() as Role | undefined;
        if (role && !Object.values(Role).includes(role)) {
          errors.push({ row: rowNum, error: `Invalid role: ${row.role}` });
          continue;
        }

        if (!dryRun) {
          // Check for duplicate email
          const existing = await prisma.user.findUnique({
            where: { email: row.email },
          });

          if (existing) {
            errors.push({
              row: rowNum,
              error: `Email ${row.email} already exists`,
            });
            continue;
          }

          // Create user
          await prisma.user.create({
            data: {
              name: row.name.trim(),
              email: row.email.trim().toLowerCase(),
              empCode: row.empCode?.trim(),
              role: role || Role.EMPLOYEE,
              department: row.department?.trim(),
              joinDate: row.joinDate ? new Date(row.joinDate) : null,
              password: await bcrypt.hash("changeme123", 10), // Default password
            },
          });

          imported++;
        } else {
          // Dry run - just validate
          imported++;
        }
      } catch (error) {
        errors.push({
          row: rowNum,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Import holidays from CSV
   */
  static async importHolidays(
    csvContent: string,
    dryRun: boolean = false
  ): Promise<ImportResult> {
    const rows = this.parseCSV<HolidayImportRow>(csvContent);
    const errors: { row: number; error: string }[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const row: HolidayImportRow = {
        date: raw.date ?? (raw as any)["Date"] ?? "",
        name: raw.name ?? (raw as any)["Holiday Name"] ?? (raw as any)["holiday name"] ?? "",
        isOptional: raw.isOptional ?? (raw as any)["Optional"] ?? (raw as any)["optional"] ?? "",
      };
      const rowNum = i + 2;

      try {
        if (!row.date || !row.name) {
          errors.push({
            row: rowNum,
            error: "Date and name are required",
          });
          continue;
        }

        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          errors.push({ row: rowNum, error: "Invalid date format" });
          continue;
        }

        if (!dryRun) {
          // Check for duplicate
          const existing = await prisma.holiday.findFirst({
            where: {
              date: {
                gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                lt: new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate() + 1
                ),
              },
            },
          });

          if (existing) {
            errors.push({
              row: rowNum,
              error: `Holiday already exists for ${row.date}`,
            });
            continue;
          }

          await prisma.holiday.create({
            data: {
              date,
              name: row.name.trim(),
              isOptional:
                row.isOptional?.toLowerCase() === "true" ||
                row.isOptional === "1",
            },
          });

          imported++;
        } else {
          imported++;
        }
      } catch (error) {
        errors.push({
          row: rowNum,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Import opening balances from CSV
   */
  static async importBalances(
    csvContent: string,
    dryRun: boolean = false
  ): Promise<ImportResult> {
    const rows = this.parseCSV<BalanceImportRow>(csvContent);
    const errors: { row: number; error: string }[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        if (!row.empCode || !row.leaveType || !row.year) {
          errors.push({
            row: rowNum,
            error: "empCode, leaveType, and year are required",
          });
          continue;
        }

        // Find user by empCode
        const user = await prisma.user.findUnique({
          where: { empCode: row.empCode },
        });

        if (!user) {
          errors.push({
            row: rowNum,
            error: `Employee not found: ${row.empCode}`,
          });
          continue;
        }

        const leaveType = row.leaveType.toUpperCase() as LeaveType;
        if (!Object.values(LeaveType).includes(leaveType)) {
          errors.push({
            row: rowNum,
            error: `Invalid leave type: ${row.leaveType}`,
          });
          continue;
        }

        if (!dryRun) {
          const opening = row.opening || 0;
          const accrued = row.accrued || 0;
          const used = row.used || 0;
          const closing = opening + accrued - used;

          await prisma.balance.upsert({
            where: {
              userId_type_year: {
                userId: user.id,
                type: leaveType,
                year: row.year,
              },
            },
            create: {
              userId: user.id,
              type: leaveType,
              year: row.year,
              opening,
              accrued,
              used,
              closing,
            },
            update: {
              opening,
              accrued,
              used,
              closing,
            },
          });

          imported++;
        } else {
          imported++;
        }
      } catch (error) {
        errors.push({
          row: rowNum,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Export data to CSV
   */
  static async exportToCSV(
    data: any[],
    columns: string[]
  ): Promise<string> {
    if (data.length === 0) {
      return "";
    }

    // CSV header
    const header = columns.join(",");

    // CSV rows
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          const value = item[col];
          // Escape commas and quotes
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",");
    });

    return [header, ...rows].join("\n");
  }

  /**
   * Export employees to CSV (import-ready format)
   */
  static exportEmployees(
    users: { name: string; email: string; empCode?: string | null; role: string; department?: string | null; joinDate?: Date | null }[]
  ): string {
    const headers = ["name", "email", "empCode", "role", "department", "joinDate"];
    const rows = users.map((u) => [
      u.name,
      u.email,
      u.empCode ?? "",
      u.role,
      u.department ?? "",
      u.joinDate ? new Date(u.joinDate).toISOString().split("T")[0] : "",
    ]);
    const escape = (v: string) => (v.includes(",") || v.includes('"') ? `"${String(v).replace(/"/g, '""')}"` : v);
    return [headers.join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  }

  /**
   * Generate import template CSV
   */
  static generateEmployeeTemplate(): string {
    const template = [
      ["name", "email", "empCode", "role", "department", "joinDate"],
      ["John Doe", "john.doe@example.com", "EMP001", "EMPLOYEE", "IT", "2024-01-01"],
      ["Jane Smith", "jane.smith@example.com", "EMP002", "DEPT_HEAD", "HR", "2023-06-15"],
    ];

    return template.map((row) => row.join(",")).join("\n");
  }

  static generateHolidayTemplate(): string {
    const template = [
      ["date", "name", "isOptional"],
      ["2025-01-01", "New Year's Day", "false"],
      ["2025-12-25", "Christmas Day", "false"],
    ];

    return template.map((row) => row.join(",")).join("\n");
  }

  static generateBalanceTemplate(): string {
    const template = [
      ["empCode", "leaveType", "year", "opening", "accrued", "used"],
      ["EMP001", "EARNED", "2025", "20", "0", "5"],
      ["EMP001", "CASUAL", "2025", "10", "0", "2"],
      ["EMP001", "MEDICAL", "2025", "14", "0", "0"],
      ["EMP001", "SPECIAL", "2025", "0", "0", "0"],
    ];

    return template.map((row) => row.join(",")).join("\n");
  }

  static generateLeaveTemplate(): string {
    const template = [
      ["employeeEmail", "type", "startDate", "endDate", "reason", "workingDays"],
      ["john@example.com", "EARNED", "2025-03-10", "2025-03-12", "Personal leave", "3"],
      ["jane@example.com", "CASUAL", "2025-03-15", "2025-03-15", "Family event", "1"],
    ];

    return template.map((row) => row.join(",")).join("\n");
  }

  static async importLeaves(
    csvContent: string,
    dryRun: boolean = false
  ): Promise<ImportResult> {
    const rows = this.parseCSV<LeaveImportRow>(csvContent);
    const errors: { row: number; error: string }[] = [];
    let imported = 0;

    const validTypes = Object.values(LeaveType);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        if (!row.employeeEmail || !row.type || !row.startDate || !row.endDate || !row.reason) {
          errors.push({
            row: rowNum,
            error: "employeeEmail, type, startDate, endDate, reason are required",
          });
          continue;
        }

        const email = row.employeeEmail.trim().toLowerCase();
        const type = row.type.toUpperCase();
        if (!validTypes.includes(type as LeaveType)) {
          errors.push({ row: rowNum, error: `Invalid leave type: ${row.type}` });
          continue;
        }

        const startDate = new Date(row.startDate);
        const endDate = new Date(row.endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push({ row: rowNum, error: "Invalid date format" });
          continue;
        }

        if (row.reason.trim().length < 3) {
          errors.push({ row: rowNum, error: "Reason must be at least 3 characters" });
          continue;
        }

        if (!dryRun) {
          const employee = await prisma.user.findUnique({
            where: { email },
          });

          if (!employee) {
            errors.push({ row: rowNum, error: `Employee not found: ${email}` });
            continue;
          }

          const workingDays = row.workingDays
            ? parseInt(row.workingDays, 10)
            : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          await prisma.leaveRequest.create({
            data: {
              requesterId: employee.id,
              type: type as LeaveType,
              startDate,
              endDate,
              reason: row.reason.trim(),
              workingDays: isNaN(workingDays) ? 1 : workingDays,
              status: LeaveStatus.APPROVED,
              policyVersion: "v2.0-bulk-import",
            },
          });

          imported++;
        } else {
          imported++;
        }
      } catch (err) {
        errors.push({
          row: rowNum,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return {
      success: errors.length === 0,
      imported,
      failed: errors.length,
      errors,
    };
  }
}
