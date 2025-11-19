"use client";

import * as React from "react";
import { Plus, Trash2, Edit, Calendar, Save, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format, parseISO, isAfter, isBefore } from "date-fns";

// ============================================
// Types
// ============================================

interface Holiday {
  id: number;
  name: string;
  date: Date;
  type: "PUBLIC" | "OPTIONAL" | "RESTRICTED";
  isRecurring: boolean;
  description?: string;
}

interface HolidayFormData {
  name: string;
  date: string;
  type: "PUBLIC" | "OPTIONAL" | "RESTRICTED";
  isRecurring: boolean;
  description?: string;
}

// ============================================
// Holiday Calendar Manager Component
// ============================================

export function HolidayCalendarManager() {
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingHoliday, setEditingHoliday] = React.useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());

  const [formData, setFormData] = React.useState<HolidayFormData>({
    name: "",
    date: "",
    type: "PUBLIC",
    isRecurring: false,
    description: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Fetch holidays
  const fetchHolidays = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/holidays?year=${selectedYear}`);

      if (!response.ok) {
        throw new Error("Failed to fetch holidays");
      }

      const data = await response.json();
      setHolidays(
        data.holidays.map((h: any) => ({
          ...h,
          date: new Date(h.date),
        }))
      );
    } catch (error) {
      toast.error("Failed to load holidays");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  React.useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Holiday name is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const selectedDate = parseISO(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check for duplicate dates (excluding current edit)
      const isDuplicate = holidays.some(
        (h) =>
          format(h.date, "yyyy-MM-dd") === formData.date &&
          h.id !== editingHoliday?.id
      );

      if (isDuplicate) {
        newErrors.date = "A holiday already exists on this date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle add/edit holiday
  const handleSaveHoliday = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const method = editingHoliday ? "PUT" : "POST";
      const url = editingHoliday
        ? `/api/holidays/${editingHoliday.id}`
        : "/api/holidays";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save holiday");
      }

      toast.success(
        editingHoliday
          ? "Holiday updated successfully"
          : "Holiday added successfully"
      );

      // Refresh holidays and close dialog
      await fetchHolidays();
      handleCloseDialog();

      // Recalculate holiday cache
      await fetch("/api/holidays/recalculate-cache", { method: "POST" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save holiday");
      console.error(error);
    }
  };

  // Handle delete holiday
  const handleDeleteHoliday = async (id: number) => {
    if (!confirm("Are you sure you want to delete this holiday?")) {
      return;
    }

    try {
      const response = await fetch(`/api/holidays/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete holiday");
      }

      toast.success("Holiday deleted successfully");

      // Refresh holidays
      await fetchHolidays();

      // Recalculate holiday cache
      await fetch("/api/holidays/recalculate-cache", { method: "POST" });
    } catch (error) {
      toast.error("Failed to delete holiday");
      console.error(error);
    }
  };

  // Open dialog for adding
  const handleAddClick = () => {
    setEditingHoliday(null);
    setFormData({
      name: "",
      date: "",
      type: "PUBLIC",
      isRecurring: false,
      description: "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  // Open dialog for editing
  const handleEditClick = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: format(holiday.date, "yyyy-MM-dd"),
      type: holiday.type,
      isRecurring: holiday.isRecurring,
      description: holiday.description || "",
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingHoliday(null);
    setFormData({
      name: "",
      date: "",
      type: "PUBLIC",
      isRecurring: false,
      description: "",
    });
    setErrors({});
  };

  // Recalculate holiday cache
  const handleRecalculateCache = async () => {
    try {
      const response = await fetch("/api/holidays/recalculate-cache", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to recalculate cache");
      }

      toast.success("Holiday cache recalculated successfully");
    } catch (error) {
      toast.error("Failed to recalculate cache");
      console.error(error);
    }
  };

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Holiday Calendar Management
            </CardTitle>
            <CardDescription>
              Manage public holidays, optional holidays, and restricted holidays
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 1 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            <Button onClick={handleAddClick} className="gap-2">
              <Plus className="size-4" />
              Add Holiday
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Info Alert */}
        <Alert className="mb-4">
          <AlertCircle className="size-4" />
          <AlertDescription>
            Changes to the holiday calendar will affect working day calculations
            for leave requests. Use "Recalculate Cache" after making changes.
          </AlertDescription>
        </Alert>

        {/* Holidays Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Holiday Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading holidays...
                  </TableCell>
                </TableRow>
              ) : sortedHolidays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No holidays found for {selectedYear}
                  </TableCell>
                </TableRow>
              ) : (
                sortedHolidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">
                      {format(holiday.date, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          holiday.type === "PUBLIC"
                            ? "default"
                            : holiday.type === "OPTIONAL"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {holiday.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {holiday.isRecurring ? (
                        <Badge variant="outline">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {holiday.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(holiday)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Recalculate Cache Button */}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={handleRecalculateCache} className="gap-2">
            <Save className="size-4" />
            Recalculate Holiday Cache
          </Button>
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
            </DialogTitle>
            <DialogDescription>
              {editingHoliday
                ? "Update the holiday details below"
                : "Enter the details for the new holiday"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Holiday Name */}
            <div>
              <Label htmlFor="name">
                Holiday Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Independence Day"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && (
                <p className="text-sm text-destructive mt-1">{errors.date}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type">Holiday Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "PUBLIC" | "OPTIONAL" | "RESTRICTED",
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="PUBLIC">Public Holiday</option>
                <option value="OPTIONAL">Optional Holiday</option>
                <option value="RESTRICTED">Restricted Holiday</option>
              </select>
            </div>

            {/* Is Recurring */}
            <div className="flex items-center gap-2">
              <input
                id="recurring"
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="size-4"
              />
              <Label htmlFor="recurring">Recurring annually</Label>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional details"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveHoliday}>
              <Save className="size-4 mr-2" />
              {editingHoliday ? "Update" : "Add"} Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
