import type { Meta, StoryObj } from '@storybook/react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
} from './drawer';
import { Button } from './button';
import { useState } from 'react';

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    children: null,
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        <Drawer {...args} open={open} onOpenChange={setOpen}>
          <DrawerHeader onClose={() => setOpen(false)}>
            <h2 className="text-lg font-semibold">Drawer Title</h2>
          </DrawerHeader>
          <DrawerBody>
            <p>This is the drawer content.</p>
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </DrawerFooter>
        </Drawer>
      </>
    );
  },
};

export const RightSheet: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    children: null,
    side: 'right',
  },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Right Sheet</Button>
        <Drawer open={open} onOpenChange={setOpen} side="right">
          <DrawerHeader onClose={() => setOpen(false)}>
            <h2 className="text-lg font-semibold">Edit Profile</h2>
          </DrawerHeader>
          <DrawerBody>
            <p>Make changes to your profile here.</p>
          </DrawerBody>
          <DrawerFooter>
            <Button onClick={() => setOpen(false)}>Save Changes</Button>
          </DrawerFooter>
        </Drawer>
      </>
    );
  },
};

export const BottomSheet: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
    children: null,
    side: 'bottom',
  },
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Bottom Sheet</Button>
        <Drawer open={open} onOpenChange={setOpen} side="bottom">
          <DrawerHeader onClose={() => setOpen(false)} showHandle>
            <h2 className="text-lg font-semibold">Options</h2>
          </DrawerHeader>
          <DrawerBody>
            <div className="grid gap-4 py-4">
              <Button variant="ghost" className="justify-start">Share</Button>
              <Button variant="ghost" className="justify-start">Add to Favorites</Button>
              <Button variant="ghost" className="justify-start text-destructive">Delete</Button>
            </div>
          </DrawerBody>
        </Drawer>
      </>
    );
  },
};
