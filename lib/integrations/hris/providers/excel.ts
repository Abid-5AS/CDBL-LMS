import * as XLSX from 'xlsx';
import { BaseHRISProvider } from './base';
import type { HRISEmployee } from '../types';

/**
 * Excel File Provider
 * Import employees from Excel file (.xlsx, .xls)
 */
export class ExcelProvider extends BaseHRISProvider {
  name = 'excel';

  constructor(private file: File) {
    super();
  }

  async sync(): Promise<HRISEmployee[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const rows = XLSX.utils.sheet_to_json(worksheet);

          const employees = rows.map((row: any) => {
            return this.normalize({
              empCode: row.empCode || row.employee_code || row.EmpCode || row['Employee Code'],
              name: row.name || row.employee_name || row.Name || row['Employee Name'],
              email: row.email || row.Email || row['Email Address'],
              department: row.department || row.Department || row.dept,
              joinDate: this.parseExcelDate(row.joinDate || row.join_date),
              retirementDate: this.parseExcelDate(row.retirementDate || row.retirement_date),
              deptHeadEmpCode: row.deptHeadEmpCode || row.manager_code || row.manager,
              status: (row.status || row.Status || 'active').toLowerCase() as any,
            });
          });

          resolve(employees);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read Excel file'));
      reader.readAsBinaryString(this.file);
    });
  }

  async test(): Promise<boolean> {
    try {
      const employees = await this.sync();
      return employees.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Parse Excel date format
   */
  private parseExcelDate(value: any): Date | undefined {
    if (!value) return undefined;

    // If already a Date object
    if (value instanceof Date) return value;

    // If Excel serial date number
    if (typeof value === 'number') {
      return XLSX.SSF.parse_date_code(value);
    }

    // If string, try to parse
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }

    return undefined;
  }
}
