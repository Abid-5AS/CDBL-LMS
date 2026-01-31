import { prisma } from '@/lib/prisma';
import type { HRISEmployee, HRISProvider, SyncResult, ConflictInfo } from './types';
import bcrypt from 'bcryptjs';

/**
 * HRIS Sync Engine
 * Handles employee data synchronization from external HRIS systems
 */
export class HRISSyncEngine {
  constructor(private provider: HRISProvider) {}

  /**
   * Sync all employees from HRIS to system
   */
  async syncAll(userId: number): Promise<SyncResult> {
    const startTime = Date.now();

    // Create sync record
    const sync = await prisma.hRISSync.create({
      data: {
        provider: this.provider.name,
        status: 'running',
        recordsTotal: 0,
        createdBy: userId,
      },
    });

    try {
      // Fetch data from HRIS
      const hrisEmployees = await this.provider.sync();

      await prisma.hRISSync.update({
        where: { id: sync.id },
        data: { recordsTotal: hrisEmployees.length },
      });

      const conflicts: ConflictInfo[] = [];
      let synced = 0;
      let failed = 0;
      let skipped = 0;

      // Process each employee
      for (const hrisEmp of hrisEmployees) {
        try {
          // Validate data
          if (!this.provider.validate(hrisEmp)) {
            failed++;
            continue;
          }

          // Skip terminated employees
          if (hrisEmp.status === 'terminated') {
            skipped++;
            continue;
          }

          // Check for existing employee by empCode
          const existing = await prisma.user.findUnique({
            where: { empCode: hrisEmp.empCode },
          });

          if (existing) {
            // Detect conflicts
            const detectedConflicts = this.detectConflicts(existing, hrisEmp);

            if (detectedConflicts.length > 0) {
              // Create conflict records
              for (const conflict of detectedConflicts) {
                await prisma.hRISConflict.create({
                  data: {
                    syncId: sync.id,
                    employeeId: existing.id,
                    conflictType: conflict.type,
                    hrisData: hrisEmp as any,
                    systemData: {
                      empCode: existing.empCode,
                      name: existing.name,
                      email: existing.email,
                      department: existing.department,
                    } as any,
                  },
                });
                conflicts.push(conflict);
              }
              skipped++;
              continue;
            }

            // Update existing employee (no conflicts)
            await prisma.user.update({
              where: { id: existing.id },
              data: {
                name: hrisEmp.name,
                email: hrisEmp.email,
                department: hrisEmp.department,
                joinDate: hrisEmp.joinDate,
                retirementDate: hrisEmp.retirementDate,
                updatedAt: new Date(),
              },
            });
            synced++;
          } else {
            // Check for duplicate email
            const duplicateEmail = await prisma.user.findUnique({
              where: { email: hrisEmp.email },
            });

            if (duplicateEmail) {
              // Email conflict
              conflicts.push({
                empCode: hrisEmp.empCode,
                type: 'duplicate',
                field: 'email',
                hrisValue: hrisEmp.email,
                systemValue: duplicateEmail.email,
              });

              await prisma.hRISConflict.create({
                data: {
                  syncId: sync.id,
                  employeeId: duplicateEmail.id,
                  conflictType: 'duplicate',
                  hrisData: hrisEmp as any,
                  systemData: { email: duplicateEmail.email } as any,
                },
              });
              skipped++;
              continue;
            }

            // Create new employee
            await prisma.user.create({
              data: {
                empCode: hrisEmp.empCode,
                name: hrisEmp.name,
                email: hrisEmp.email,
                department: hrisEmp.department,
                joinDate: hrisEmp.joinDate,
                retirementDate: hrisEmp.retirementDate,
                role: 'EMPLOYEE',
                password: await this.generateTempPassword(),
              },
            });
            synced++;
          }
        } catch (error) {
          console.error(`Failed to sync employee ${hrisEmp.empCode}:`, error);
          failed++;
        }
      }

      const duration = Date.now() - startTime;

      // Update sync record
      await prisma.hRISSync.update({
        where: { id: sync.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          recordsSynced: synced,
          recordsFailed: failed,
        },
      });

      return {
        success: true,
        recordsProcessed: hrisEmployees.length,
        recordsSynced: synced,
        recordsFailed: failed,
        recordsSkipped: skipped,
        conflicts,
        errors: [],
        duration,
      };
    } catch (error) {
      // Mark sync as failed
      await prisma.hRISSync.update({
        where: { id: sync.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errors: [String(error)],
        },
      });

      throw error;
    }
  }

  /**
   * Detect conflicts between existing data and HRIS data
   */
  private detectConflicts(existing: any, hris: HRISEmployee): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    // Name mismatch
    if (existing.name !== hris.name) {
      conflicts.push({
        empCode: hris.empCode,
        type: 'mismatch',
        field: 'name',
        hrisValue: hris.name,
        systemValue: existing.name,
      });
    }

    // Email mismatch
    if (existing.email !== hris.email) {
      conflicts.push({
        empCode: hris.empCode,
        type: 'mismatch',
        field: 'email',
        hrisValue: hris.email,
        systemValue: existing.email,
      });
    }

    // Department mismatch
    if (existing.department !== hris.department) {
      conflicts.push({
        empCode: hris.empCode,
        type: 'mismatch',
        field: 'department',
        hrisValue: hris.department,
        systemValue: existing.department,
      });
    }

    return conflicts;
  }

  /**
   * Generate temporary password for new employees
   */
  private async generateTempPassword(): Promise<string> {
    // Generate secure temporary password
    return bcrypt.hash('ChangeMe@123', 10);
  }

  /**
   * Resolve a conflict
   */
  static async resolveConflict(
    conflictId: number,
    resolution: 'keep_hris' | 'keep_system' | 'merge',
    userId: number
  ): Promise<void> {
    const conflict = await prisma.hRISConflict.findUnique({
      where: { id: conflictId },
    });

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (resolution === 'keep_hris') {
      // Update system with HRIS data
      const hrisData = conflict.hrisData as any;
      await prisma.user.update({
        where: { id: conflict.employeeId! },
        data: {
          name: hrisData.name,
          email: hrisData.email,
          department: hrisData.department,
          joinDate: hrisData.joinDate ? new Date(hrisData.joinDate) : null,
          retirementDate: hrisData.retirementDate ? new Date(hrisData.retirementDate) : null,
        },
      });
    }
    // If 'keep_system', do nothing
    // If 'merge', could implement custom merge logic

    // Mark conflict as resolved
    await prisma.hRISConflict.update({
      where: { id: conflictId },
      data: {
        resolution,
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
    });
  }
}
