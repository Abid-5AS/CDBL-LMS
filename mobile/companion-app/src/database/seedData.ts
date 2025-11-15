import { saveUserProfile, saveLeaveBalances } from './index';

/**
 * Seed Data Helper
 *
 * Populates the database with sample data for testing
 * This makes it easy to test the app without a backend connection
 */

export interface SeedDataOptions {
  userProfile?: {
    employeeId: string;
    name: string;
    email: string;
    department?: string;
    role?: string;
  };
  balances?: Array<{
    leaveType: string;
    total: number;
    used: number;
    pending: number;
    available: number;
    year: number;
  }>;
}

/**
 * Default seed data for testing
 */
export const DEFAULT_SEED_DATA: SeedDataOptions = {
  userProfile: {
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@cdbl.com',
    department: 'Engineering',
    role: 'Software Engineer',
  },
  balances: [
    {
      leaveType: 'Casual Leave',
      total: 12,
      used: 2,
      pending: 0,
      available: 10,
      year: new Date().getFullYear(),
    },
    {
      leaveType: 'Earned Leave',
      total: 20,
      used: 5,
      pending: 2,
      available: 13,
      year: new Date().getFullYear(),
    },
    {
      leaveType: 'Medical Leave',
      total: 14,
      used: 3,
      pending: 1,
      available: 10,
      year: new Date().getFullYear(),
    },
    {
      leaveType: 'Maternity Leave',
      total: 90,
      used: 0,
      pending: 0,
      available: 90,
      year: new Date().getFullYear(),
    },
  ],
};

/**
 * Seed the database with sample data
 */
export async function seedDatabase(options: SeedDataOptions = DEFAULT_SEED_DATA): Promise<void> {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Seed user profile
    if (options.userProfile) {
      await saveUserProfile(options.userProfile);
      console.log('✅ User profile seeded');
    }

    // Seed leave balances
    if (options.balances) {
      await saveLeaveBalances(options.balances);
      console.log('✅ Leave balances seeded');
    }

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

/**
 * Seed data with custom user profile
 */
export async function seedWithCustomProfile(
  name: string,
  email: string,
  department?: string,
  role?: string
): Promise<void> {
  const employeeId = `EMP${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  await seedDatabase({
    userProfile: {
      employeeId,
      name,
      email,
      department: department || 'Engineering',
      role: role || 'Employee',
    },
    balances: DEFAULT_SEED_DATA.balances,
  });
}

/**
 * Quick seed for development
 */
export async function quickSeed(): Promise<void> {
  await seedDatabase(DEFAULT_SEED_DATA);
}
