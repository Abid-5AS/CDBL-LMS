import type { Meta, StoryObj } from '@storybook/react';
import { EmployeeDetailView } from './EmployeeDetailView';
import type { EmployeeDashboardData } from '@/lib/employee';

const mockEmployee: EmployeeDashboardData = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'EMPLOYEE',
  department: 'Engineering',
  designation: 'Senior Software Engineer',
  manager: 'Jane Smith',
  managerEmail: 'jane.smith@example.com',
  employmentStatus: 'Active',
  joiningDate: '2022-01-15',
  stats: {
    employeesOnLeave: 2,
    pendingRequests: 1,
    avgApprovalTime: 1.5,
    totalLeavesThisYear: 12,
    encashmentPending: 0,
  },
  balances: [
    { type: 'Casual', used: 5, total: 14, remaining: 9 },
    { type: 'Sick', used: 2, total: 14, remaining: 12 },
    { type: 'Earned', used: 10, total: 30, remaining: 20 },
  ],
  monthlyTrend: [
    { month: 'Jan', leavesTaken: 2 },
    { month: 'Feb', leavesTaken: 0 },
    { month: 'Mar', leavesTaken: 3 },
    { month: 'Apr', leavesTaken: 1 },
    { month: 'May', leavesTaken: 0 },
    { month: 'Jun', leavesTaken: 5 },
  ],
  distribution: [
    { type: 'CASUAL', value: 5 },
    { type: 'SICK', value: 2 },
    { type: 'EARNED', value: 10 },
  ],
  history: [
    {
      id: 101,
      type: 'CASUAL',
      start: '2024-06-10T00:00:00.000Z',
      end: '2024-06-12T00:00:00.000Z',
      days: 3,
      status: 'APPROVED',
    },
    {
      id: 102,
      type: 'SICK',
      start: '2024-05-15T00:00:00.000Z',
      end: '2024-05-15T00:00:00.000Z',
      days: 1,
      status: 'APPROVED',
    },
    {
      id: 103,
      type: 'EARNED',
      start: '2024-07-20T00:00:00.000Z',
      end: '2024-07-25T00:00:00.000Z',
      days: 5,
      status: 'PENDING',
    },
  ],
  pendingRequestId: 103,
};

const meta = {
  title: 'Shared/EmployeeDetailView',
  component: EmployeeDetailView,
  parameters: {
    layout: 'padded',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmployeeDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ViewAsHRAdmin: Story = {
  args: {
    employee: mockEmployee,
    viewerRole: 'HR_ADMIN',
    breadcrumbLabel: 'All Employees',
  },
};

export const ViewAsManager: Story = {
  args: {
    employee: {
      ...mockEmployee,
      role: 'EMPLOYEE',
    },
    viewerRole: 'DEPT_HEAD',
    breadcrumbLabel: 'My Team',
  },
};

export const ViewAsSelf: Story = {
  args: {
    employee: mockEmployee,
    viewerRole: 'EMPLOYEE',
    breadcrumbLabel: 'My Profile',
  },
};

export const ViewCEOProfile: Story = {
  args: {
    employee: {
      ...mockEmployee,
      name: 'Alice CEO',
      role: 'CEO',
      designation: 'Chief Executive Officer',
      manager: null,
      department: 'Executive',
    },
    viewerRole: 'HR_ADMIN',
  },
};
