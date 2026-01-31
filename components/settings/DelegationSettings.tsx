"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";

import { createDelegation, revokeDelegation } from "@/app/actions/delegation-actions";
import { LeaveType } from "@/src/generated/prisma/client";
import { LEAVE_TYPE_LABELS } from "@/lib/constants";

const formSchema = z.object({
  delegateId: z.string().min(1, "Please select a delegate"),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  reason: z.string().optional(),
  isPermanent: z.boolean().default(false),
  leaveTypes: z.array(z.string()).optional(),
});

type DelegationSettingsProps = {
  activeDelegations: any[];
  delegatedToMe: any[];
};

export function DelegationSettings({ activeDelegations, delegatedToMe }: DelegationSettingsProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isPermanent: false,
      leaveTypes: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("delegateId", values.delegateId);
      formData.append("startDate", values.dateRange.from.toISOString());
      formData.append("endDate", values.dateRange.to.toISOString());
      if (values.reason) formData.append("reason", values.reason);
      if (values.isPermanent) formData.append("isPermanent", "on");
      if (values.leaveTypes && values.leaveTypes.length > 0) {
        formData.append("leaveTypes", JSON.stringify(values.leaveTypes));
      }

      const result = await createDelegation({}, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Delegation created successfully");
        setShowForm(false);
        form.reset();
      }
    });
  }

  const handleRevoke = (id: number) => {
    startTransition(async () => {
      const result = await revokeDelegation(id);
      if (result.success) {
        toast.success("Delegation revoked");
      } else {
        toast.error(result.error);
      }
    });
  };

  const loadUsers = async (query: string): Promise<AutocompleteOption[]> => {
    if (!query || query.length < 2) return [];
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.employees.map((emp: any) => ({
        value: String(emp.id),
        label: emp.title,
        description: emp.subtitle,
      }));
    } catch (error) {
      console.error("Failed to load users", error);
      return [];
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Delegations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Delegations</CardTitle>
            <CardDescription>
              Manage who can approve requests on your behalf.
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(!showForm)} disabled={showForm}>
            <Plus className="mr-2 h-4 w-4" />
            New Delegation
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-8 rounded-lg border p-4 bg-muted/30">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="delegateId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Delegate To</FormLabel>
                          <FormControl>
                            <Autocomplete
                              placeholder="Search employee..."
                              onLoadOptions={loadUsers}
                              onValueChange={field.onChange}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateRange"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Duration</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value?.from ? (
                                    field.value.to ? (
                                      <>
                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                        {format(field.value.to, "LLL dd, y")}
                                      </>
                                    ) : (
                                      format(field.value.from, "LLL dd, y")
                                    )
                                  ) : (
                                    <span>Pick a date range</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="range"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Annual Leave" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPermanent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Indefinite Delegation</FormLabel>
                          <FormDescription>
                            This delegation will remain active until manually revoked.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Delegation
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Delegate</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeDelegations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active delegations found.
                  </TableCell>
                </TableRow>
              ) : (
                activeDelegations.map((delegation) => (
                  <TableRow key={delegation.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p>{delegation.delegate.name}</p>
                          <p className="text-xs text-muted-foreground">{delegation.delegate.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {delegation.isPermanent ? (
                        <Badge variant="outline">Indefinite</Badge>
                      ) : (
                        <span className="text-sm">
                          {format(new Date(delegation.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(delegation.endDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {delegation.isActive ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {delegation.reason || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {delegation.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevoke(delegation.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Revoke</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delegated To Me */}
      {delegatedToMe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acting As Delegate</CardTitle>
            <CardDescription>
              You have been assigned approval authority by the following users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegator</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegatedToMe.map((delegation) => (
                  <TableRow key={delegation.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-primary" />
                        <div>
                          <p>{delegation.delegator.name}</p>
                          <p className="text-xs text-muted-foreground">{delegation.delegator.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {delegation.isPermanent ? (
                        <Badge variant="outline">Indefinite</Badge>
                      ) : (
                        <span className="text-sm">
                          {format(new Date(delegation.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(delegation.endDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {delegation.reason || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
