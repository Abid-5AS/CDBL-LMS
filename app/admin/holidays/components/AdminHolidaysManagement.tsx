"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Holiday = {
  id: number;
  name: string;
  date: string;
  isOptional: boolean;
};

export function AdminHolidaysManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHolidayId, setDeletingHolidayId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    isOptional: false,
  });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      const res = await fetch("/api/holidays");
      if (!res.ok) throw new Error("Failed to load holidays");
      const data = await res.json();
      setHolidays(data.items || []);
    } catch (error) {
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        date: holiday.date.split("T")[0],
        isOptional: holiday.isOptional,
      });
    } else {
      setEditingHoliday(null);
      setFormData({
        name: "",
        date: "",
        isOptional: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const url = editingHoliday
        ? `/api/holidays/${editingHoliday.id}`
        : "/api/holidays";
      const method = editingHoliday ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save holiday");
      }

      toast.success(editingHoliday ? "Holiday updated" : "Holiday created");
      setDialogOpen(false);
      loadHolidays();
    } catch (error: any) {
      toast.error(error.message || "Failed to save holiday");
    }
  };

  const handleDelete = async () => {
    if (!deletingHolidayId) return;

    try {
      const res = await fetch(`/api/holidays/${deletingHolidayId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete holiday");

      toast.success("Holiday deleted");
      setDeleteDialogOpen(false);
      setDeletingHolidayId(null);
      loadHolidays();
    } catch (error) {
      toast.error("Failed to delete holiday");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Holidays Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Holidays Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage company holidays and optional days off
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingHoliday ? "Edit Holiday" : "Add New Holiday"}
                </DialogTitle>
                <DialogDescription>
                  {editingHoliday
                    ? "Update holiday details"
                    : "Create a new company holiday"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Holiday Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., New Year's Day"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="optional"
                    checked={formData.isOptional}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isOptional: !!checked })
                    }
                  />
                  <Label htmlFor="optional" className="cursor-pointer">
                    Optional holiday
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingHoliday ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Holidays
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No holidays found
                    </TableCell>
                  </TableRow>
                ) : (
                  holidays.map((holiday) => (
                    <TableRow key={holiday.id}>
                      <TableCell className="font-medium">{holiday.name}</TableCell>
                      <TableCell>{formatDate(holiday.date)}</TableCell>
                      <TableCell>
                        {holiday.isOptional ? (
                          <span className="text-xs text-blue-600">Optional</span>
                        ) : (
                          <span className="text-xs text-slate-600">Mandatory</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(holiday)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingHolidayId(holiday.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the holiday.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingHolidayId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

