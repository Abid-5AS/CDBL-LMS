import Papa from "papaparse";
import { PayrollSummary } from "./calculator";

export class PayrollExportService {
    /**
     * Generate CSV content from payroll summaries
     */
    static generateCSV(summaries: PayrollSummary[]): string {
        // Flatten data for CSV
        const data = summaries.map((summary) => {
            const flatData: any = {
                "Employee ID": summary.employeeId,
                "Month": summary.month + 1, // 1-indexed for display
                "Year": summary.year,
                "Total Working Days": summary.totalWorkingDays,
                "Present Days": summary.totalPresentDays,
                "Paid Leave Days": summary.totalPaidLeaveDays,
                "Unpaid Leave Days": summary.totalUnpaidLeaveDays,
                "LWP Deduction Days": summary.lwpDeductionDays,
            };

            // Add breakdown columns dynamically
            Object.entries(summary.breakdown).forEach(([type, details]) => {
                flatData[`${type} (Days)`] = details.days;
            });

            return flatData;
        });

        return Papa.unparse(data);
    }

    /**
     * Generate filename for export
     */
    static getFilename(month: number, year: number, format: "csv" | "xlsx" = "csv"): string {
        const date = new Date(year, month);
        const monthName = date.toLocaleString("default", { month: "long" });
        return `payroll_export_${monthName}_${year}.${format}`;
    }
}
