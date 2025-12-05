import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedDatePicker, Holiday } from './enhanced-date-picker';
import { useState } from 'react';
import { addDays, subDays } from 'date-fns';

const meta = {
  title: 'UI/EnhancedDatePicker',
  component: EnhancedDatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    disableWeekends: {
      control: 'boolean',
    },
    showHolidayNames: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
    helperText: {
      control: 'text',
    },
  },
} satisfies Meta<typeof EnhancedDatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const holidays: Holiday[] = [
  { date: new Date(), name: 'Today Holiday', type: 'public' },
  { date: addDays(new Date(), 2), name: 'Company Event', type: 'company' },
  { date: subDays(new Date(), 5), name: 'Past Holiday', type: 'religious' },
];

export const Default: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <EnhancedDatePicker {...args} value={date} onChange={setDate} />;
  },
};

export const WithHolidays: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <EnhancedDatePicker
        {...args}
        value={date}
        onChange={setDate}
        holidays={holidays}
        label="Select Date (Check holidays)"
      />
    );
  },
};

export const DisabledWeekends: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <EnhancedDatePicker
        {...args}
        value={date}
        onChange={setDate}
        disableWeekends
        label="Business Days Only"
      />
    );
  },
};

export const WithError: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return (
      <EnhancedDatePicker
        {...args}
        value={date}
        onChange={setDate}
        error="Date is required"
        label="Start Date"
      />
    );
  },
};
