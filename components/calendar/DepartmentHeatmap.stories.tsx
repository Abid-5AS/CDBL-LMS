import type { Meta, StoryObj } from '@storybook/react';
import { DepartmentHeatmap } from './DepartmentHeatmap';

const meta = {
  title: 'Calendar/DepartmentHeatmap',
  component: DepartmentHeatmap,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DepartmentHeatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentUserRole: 'HR_ADMIN',
  },
};

export const AsEmployee: Story = {
  args: {
    currentUserRole: 'EMPLOYEE',
  },
};

export const AsCEO: Story = {
  args: {
    currentUserRole: 'CEO',
  },
};
