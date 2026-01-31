import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';
import { Mail, Search, Lock, User } from 'lucide-react';

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'ghost', 'glass', 'error', 'success'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    floating: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Input variant="default" placeholder="Default" />
      <Input variant="filled" placeholder="Filled" />
      <Input variant="ghost" placeholder="Ghost" />
      <Input variant="glass" placeholder="Glass" />
      <Input variant="error" placeholder="Error" errorMessage="Invalid input" />
      <Input variant="success" placeholder="Success" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Input size="sm" placeholder="Small" />
      <Input size="default" placeholder="Default" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Input leftIcon={<Search className="h-4 w-4" />} placeholder="Search..." />
      <Input leftIcon={<Mail className="h-4 w-4" />} placeholder="Email" />
      <Input rightIcon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" />
      <Input 
        leftIcon={<User className="h-4 w-4" />} 
        rightIcon={<Search className="h-4 w-4" />} 
        placeholder="Both icons" 
      />
    </div>
  ),
};

export const FloatingLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-[300px] pt-4">
      <Input floating label="Username" placeholder=" " />
      <Input floating label="Email Address" leftIcon={<Mail className="h-4 w-4" />} placeholder=" " />
    </div>
  ),
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    helperText: 'Must be at least 8 characters.',
    placeholder: 'Enter password',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Input {...args} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Input disabled placeholder="Disabled" />
      <Input disabled value="Disabled with value" readOnly />
    </div>
  ),
};
