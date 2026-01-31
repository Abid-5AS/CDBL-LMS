import Papa from 'papaparse';
import { BaseHRISProvider } from './base';
import type { HRISEmployee } from '../types';

/**
 * CSV File Provider
 * Import employees from CSV file
 */
export class CSVProvider extends BaseHRISProvider {
  name = 'csv';

  constructor(private file: File) {
    super();
  }

  async sync(): Promise<HRISEmployee[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(this.file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const employees = results.data.map((row: any) => {
              return this.normalize({
                empCode: row.empCode || row.employee_code || row.EmpCode || row['Employee Code'],
                name: row.name || row.employee_name || row.Name || row['Employee Name'],
                email: row.email || row.Email || row['Email Address'],
                department: row.department || row.Department || row.dept,
                joinDate: row.joinDate || row.join_date ? new Date(row.joinDate || row.join_date) : undefined,
                retirementDate: row.retirementDate || row.retirement_date ? new Date(row.retirementDate || row.retirement_date) : undefined,
                deptHeadEmpCode: row.deptHeadEmpCode || row.manager_code || row.manager,
                status: (row.status || row.Status || 'active').toLowerCase() as any,
              });
            });
            resolve(employees);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error),
      });
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
}
