# Component Usage Guidelines

This document provides guidelines for using UI components consistently across the CDBL LMS application.

## Import Pattern

**Always use barrel exports** from `@/components/ui`:

```tsx
// ✅ CORRECT - Single import from barrel
import { Button, Input, Card, Badge } from "@/components/ui";

// ❌ WRONG - Multiple individual imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
```

## Core Components

### Button

```tsx
import { Button } from "@/components/ui";

// Primary action (gradient background)
<Button variant="gradient" size="lg">
  Submit
</Button>

// Secondary action
<Button variant="outline">
  Cancel
</Button>

// Tertiary action
<Button variant="ghost">
  Learn More
</Button>

// Link style
<Button variant="link">
  View Details
</Button>

// With icons
<Button>
  <Save className="size-5" />
  Save Changes
</Button>

// Loading state
<Button disabled>
  <Loader2 className="size-5 animate-spin" />
  Loading...
</Button>
```

**Button Variants:**
- `gradient` (default) - Primary CTAs, main actions
- `outline` - Secondary actions
- `ghost` - Tertiary actions, minimal emphasis
- `link` - Inline links, less important actions

**Button Sizes:**
- `lg` - Prominent CTAs
- `default` - Standard buttons

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

// Standard card
<Card className="solid-card">
  <CardHeader>
    <CardTitle>Leave Balance</CardTitle>
    <CardDescription>Your current leave status</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>

// Interactive card
<Card className="solid-card cursor-pointer hover:scale-[1.02] transition-all">
  <CardContent className="p-6">
    {/* Clickable content */}
  </CardContent>
</Card>
```

**Card Best Practices:**
- Always use `solid-card` class for consistent styling
- Use `CardHeader` for titles and descriptions
- Use `CardContent` for main content
- Add `cursor-pointer` and hover effects for clickable cards

### Input & Form Fields

```tsx
import { Input, Label } from "@/components/ui";

// Standard input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="your.email@example.com"
    required
  />
</div>

// Input with icon
<div className="relative">
  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
  <Input
    id="email"
    type="email"
    placeholder="Email"
    className="pl-11"
  />
</div>

// Input with error
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input
    id="field"
    aria-invalid={!!error}
    aria-describedby="field-error"
  />
  {error && (
    <p id="field-error" className="text-xs text-data-error">
      {error}
    </p>
  )}
</div>
```

### Input OTP

For 6-digit verification codes:

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui";

<InputOTP maxLength={6} value={otp} onChange={setOtp}>
  <InputOTPGroup className="gap-2">
    <InputOTPSlot index={0} className="size-12 text-lg font-bold rounded-xl" />
    <InputOTPSlot index={1} className="size-12 text-lg font-bold rounded-xl" />
    <InputOTPSlot index={2} className="size-12 text-lg font-bold rounded-xl" />
  </InputOTPGroup>
  <InputOTPGroup className="gap-2">
    <InputOTPSlot index={3} className="size-12 text-lg font-bold rounded-xl" />
    <InputOTPSlot index={4} className="size-12 text-lg font-bold rounded-xl" />
    <InputOTPSlot index={5} className="size-12 text-lg font-bold rounded-xl" />
  </InputOTPGroup>
</InputOTP>
```

### Badge

```tsx
import { Badge } from "@/components/ui";

// Status badges
<Badge className="bg-data-success text-text-inverted">Approved</Badge>
<Badge className="bg-data-warning text-text-inverted">Pending</Badge>
<Badge className="bg-data-error text-text-inverted">Rejected</Badge>
<Badge className="bg-data-info text-text-inverted">Info</Badge>

// Secondary variant
<Badge variant="secondary">Draft</Badge>

// Outline variant
<Badge variant="outline">New</Badge>
```

**Badge Color Guidelines:**
- Success (green) - Approved, completed, active
- Warning (amber) - Pending, requires attention
- Error (red) - Rejected, failed, critical
- Info (blue) - Informational, neutral

### Select

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### Dialog / Modal

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description text
      </DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### Table

```tsx
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui";

<div className="rounded-lg border border-border-strong overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead>Date</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="font-medium">John Doe</TableCell>
        <TableCell>
          <Badge className="bg-data-success text-text-inverted">Approved</Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">2024-01-15</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

### ModernTable (Recommended)

For complex tables with features:

```tsx
import { ModernTable } from "@/components/ui";

<ModernTable
  data={data}
  columns={columns}
  searchable
  pagination
  itemsPerPage={10}
/>
```

### Progress

```tsx
import { Progress } from "@/components/ui";

<Progress
  value={75}
  className="h-2"
  indicatorClassName="bg-data-success"
/>
```

### Skeleton

```tsx
import { Skeleton } from "@/components/ui";

// Loading card
<Card>
  <CardHeader>
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-4 w-48 mt-1" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-24 w-full" />
  </CardContent>
</Card>

// Loading table
<div className="space-y-2">
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
  <Skeleton className="h-12 w-full" />
</div>
```

### Tooltip

```tsx
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="size-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Helpful tooltip text</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Accordion

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui";

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>
      Content for section 1
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section 2</AccordionTrigger>
    <AccordionContent>
      Content for section 2
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Overview content
  </TabsContent>
  <TabsContent value="details">
    Details content
  </TabsContent>
  <TabsContent value="history">
    History content
  </TabsContent>
</Tabs>
```

## Shared Components

### EmptyState

For empty data states:

```tsx
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";

<EmptyState
  icon={Inbox}
  title="No items found"
  description="There are no items to display at this time."
  action={
    <Button onClick={handleCreate}>
      Create New Item
    </Button>
  }
/>
```

### LeaveBalancePanel

Display leave balances:

```tsx
import { LeaveBalancePanel } from "@/components/shared/LeaveBalancePanel";

// Full variant (dashboard)
<LeaveBalancePanel
  balances={[
    { type: "EARNED", used: 5, total: 21 },
    { type: "CASUAL", used: 3, total: 10 },
    { type: "MEDICAL", used: 2, total: 14 },
  ]}
  variant="full"
  showMeters
/>

// Compact variant (profiles)
<LeaveBalancePanel
  balances={balances}
  variant="compact"
  showMeters
/>
```

### DashboardGridSkeleton

Loading state for dashboards:

```tsx
import { DashboardGridSkeleton } from "@/components/shared/skeletons";

<DashboardGridSkeleton cards={4} />
```

### CardSkeleton

Loading state for individual cards:

```tsx
import { CardSkeleton } from "@/components/shared/skeletons";

<CardSkeleton />
```

## Component Composition

### Form Pattern

```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Field 1 */}
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" required />
  </div>

  {/* Field 2 */}
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" required />
  </div>

  {/* Actions */}
  <div className="flex items-center gap-3">
    <Button type="submit">Submit</Button>
    <Button type="button" variant="outline" onClick={onCancel}>
      Cancel
    </Button>
  </div>
</form>
```

### List with Empty State Pattern

```tsx
{data.length > 0 ? (
  <div className="space-y-4">
    {data.map((item) => (
      <Card key={item.id}>
        {/* Item content */}
      </Card>
    ))}
  </div>
) : (
  <EmptyState
    icon={Inbox}
    title="No items"
    description="No items found"
  />
)}
```

### Loading State Pattern

```tsx
{loading ? (
  <DashboardGridSkeleton cards={4} />
) : (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {/* Actual content */}
  </div>
)}
```

### Error State Pattern

```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

## Accessibility

### Required Attributes

```tsx
// Buttons
<Button
  type="button"
  disabled={loading}
  aria-busy={loading}
  aria-label="Submit form"
>
  Submit
</Button>

// Inputs
<Input
  id="email"
  type="email"
  required
  aria-required="true"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>

// Icons
<Calendar className="size-5" aria-hidden="true" />
```

### Focus Management

```tsx
// Interactive cards
<Card
  className="cursor-pointer"
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
>
  {/* Content */}
</Card>
```

## Common Patterns

### Status Indicator

```tsx
<div className="flex items-center gap-2">
  <div className={cn(
    "size-2 rounded-full",
    status === "active" ? "bg-data-success" : "bg-data-error"
  )} />
  <span className="text-sm text-foreground">{status}</span>
</div>
```

### Info Card

```tsx
<Card className="border-data-info bg-data-info/10">
  <CardContent className="flex items-start gap-3 p-4">
    <Info className="size-5 text-data-info shrink-0" />
    <div className="text-sm text-foreground">
      <p className="font-medium">Important Information</p>
      <p className="text-muted-foreground mt-1">
        Additional details here
      </p>
    </div>
  </CardContent>
</Card>
```

### Stat Card

```tsx
<Card className="solid-card">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total Leaves</p>
        <p className="text-3xl font-bold text-foreground mt-1">45</p>
      </div>
      <Calendar className="size-12 text-muted-foreground/30" />
    </div>
  </CardContent>
</Card>
```

## Component Don'ts

1. **Don't create custom components for existing patterns**
   ```tsx
   // ❌ WRONG
   const CustomButton = () => <div className="...">...</div>

   // ✅ CORRECT
   <Button variant="outline">...</Button>
   ```

2. **Don't bypass component props**
   ```tsx
   // ❌ WRONG
   <Button className="bg-red-500">Delete</Button>

   // ✅ CORRECT
   <Button variant="destructive">Delete</Button>
   ```

3. **Don't nest interactive elements**
   ```tsx
   // ❌ WRONG
   <Button>
     <a href="/link">Click</a>
   </Button>

   // ✅ CORRECT
   <Button asChild>
     <a href="/link">Click</a>
   </Button>
   ```

4. **Don't forget loading states**
   ```tsx
   // ❌ WRONG
   <Button onClick={handleSubmit}>Submit</Button>

   // ✅ CORRECT
   <Button onClick={handleSubmit} disabled={loading}>
     {loading && <Loader2 className="size-5 animate-spin" />}
     {loading ? "Submitting..." : "Submit"}
   </Button>
   ```

## Quick Reference

### Most Used Components

```tsx
// Layout
Card, CardHeader, CardTitle, CardContent

// Forms
Button, Input, Label, Select, Textarea

// Feedback
Badge, Alert, Progress, Skeleton, Tooltip

// Navigation
Tabs, Breadcrumb

// Data Display
Table, ModernTable, EmptyState

// Overlays
Dialog, Popover, DropdownMenu
```
