"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Switch,
  Button,
} from "@/components/ui";
import { toast } from "sonner";

type HolidayAdminPanelProps = {
  onCreated?: () => void | Promise<void>;
};

export function HolidayAdminPanel({ onCreated }: HolidayAdminPanelProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [isOptional, setIsOptional] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !date) {
      setError("Name and date are required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          date,
          isOptional,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error === "duplicate_date"
            ? "A holiday already exists on that date"
            : payload?.error || "Failed to add holiday"
        );
      }

      toast.success("Holiday added successfully");
      setName("");
      setDate("");
      setIsOptional(false);
      await onCreated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add holiday";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="surface-card border border-dashed border-border/70">
      <CardHeader>
        <CardTitle className="text-lg">Manage Holidays</CardTitle>
        <CardDescription>
          HR admins can add upcoming closures without leaving the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="holiday-name">Holiday name</Label>
            <Input
              id="holiday-name"
              placeholder="e.g., National Mourning Day"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="holiday-date">Date</Label>
            <Input
              id="holiday-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              Optional holiday
              <Switch
                checked={isOptional}
                onCheckedChange={(checked) => setIsOptional(Boolean(checked))}
              />
            </Label>
            <p className="text-xs text-muted-foreground">
              Optional holidays still appear in the grid but are hidden from
              employees who opt out.
            </p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Changes are synced instantly to the calendar and reports.
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Saving..." : "Add holiday"}
            </Button>
          </div>
        </form>
        {error && (
          <p className="mt-2 text-sm text-data-error" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
