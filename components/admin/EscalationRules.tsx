"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Role } from "@/src/generated/prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { createEscalationRule, deleteEscalationRule, toggleEscalationRule } from "@/app/actions/escalation-actions";

const formSchema = z.object({
  role: z.nativeEnum(Role),
  timeoutHours: z.coerce.number().min(1, "Must be at least 1 hour"),
  escalateToRole: z.nativeEnum(Role),
});

type EscalationRulesProps = {
  rules: any[];
};

export function EscalationRules({ rules }: EscalationRulesProps) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeoutHours: 24,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("role", values.role);
      formData.append("timeoutHours", String(values.timeoutHours));
      formData.append("escalateToRole", values.escalateToRole);

      const result = await createEscalationRule({}, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Rule created successfully");
        setShowForm(false);
        form.reset();
      }
    });
  }

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    startTransition(async () => {
      const result = await deleteEscalationRule(id);
      if (result.success) {
        toast.success("Rule deleted");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggle = (id: number, isActive: boolean) => {
    startTransition(async () => {
      const result = await toggleEscalationRule(id, isActive);
      if (result.success) {
        toast.success(isActive ? "Rule activated" : "Rule deactivated");
      } else {
        toast.error(result.error);
      }
    });
  };

  const roles = Object.values(Role);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Escalation Rules</CardTitle>
          <CardDescription>
            Define rules to automatically escalate overdue approvals.
          </CardDescription>
        </div>
        <Button onClick={() => setShowForm(!showForm)} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-8 rounded-lg border p-4 bg-muted/30">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>If Pending With</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeoutHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>For (Hours)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="escalateToRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escalate To</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    Create Rule
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Timeout</TableHead>
              <TableHead>Escalate To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No escalation rules defined.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Badge variant="outline">{rule.role}</Badge>
                  </TableCell>
                  <TableCell>{rule.timeoutHours} hours</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rule.escalateToRole}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                      disabled={isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(rule.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
