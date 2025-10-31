"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Calendar, Upload, Download, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";

type Holiday = {
  id: number;
  name: string;
  date: string;
  isOptional: boolean;
};

type ValidationError = {
  row: number;
  field: string;
  message: string;
};

export function AdminHolidaysManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deletingHolidayId, setDeletingHolidayId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    isOptional: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvErrors, setCsvErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Holiday name is required";
    } else if (formData.name.trim().length < 3) {
      errors.name = "Holiday name must be at least 3 characters";
    }
    
    if (!formData.date) {
      errors.date = "Date is required";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if date is in the past (optional, uncomment if needed)
      // if (selectedDate < today && !editingHoliday) {
      //   errors.date = "Cannot add holidays in the past";
      // }
      
      // Check for duplicate dates (excluding current holiday when editing)
      const duplicate = holidays.find(
        h => h.date.split('T')[0] === formData.date && h.id !== editingHoliday?.id
      );
      if (duplicate) {
        errors.date = `A holiday already exists on this date: ${duplicate.name}`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
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

      toast.success(editingHoliday ? "Holiday updated successfully!" : "Holiday created successfully!");
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

      toast.success("Holiday deleted successfully!");
      setDeleteDialogOpen(false);
      setDeletingHolidayId(null);
      loadHolidays();
    } catch (error) {
      toast.error("Failed to delete holiday");
    }
  };

  const parseCSV = (text: string): { name: string; date: string; isOptional: boolean }[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('holiday'));
    const dateIndex = headers.findIndex(h => h.includes('date'));
    const optionalIndex = headers.findIndex(h => h.includes('optional') || h.includes('type'));
    
    if (nameIndex === -1 || dateIndex === -1) {
      throw new Error('CSV must contain "name" and "date" columns');
    }
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      return {
        name: values[nameIndex] || '',
        date: values[dateIndex] || '',
        isOptional: optionalIndex >= 0 ? 
          (values[optionalIndex]?.toLowerCase().includes('optional') || values[optionalIndex]?.toLowerCase() === 'yes' || values[optionalIndex]?.toLowerCase() === 'true') : 
          false
      };
    }).filter(row => row.name && row.date);
  };

  const validateCSVData = (data: { name: string; date: string; isOptional: boolean }[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const existingDates = new Set(holidays.map(h => h.date.split('T')[0]));
    
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of header and 0-based index
      
      if (!row.name.trim()) {
        errors.push({ row: rowNumber, field: 'name', message: 'Holiday name is required' });
      } else if (row.name.trim().length < 3) {
        errors.push({ row: rowNumber, field: 'name', message: 'Holiday name must be at least 3 characters' });
      }
      
      if (!row.date) {
        errors.push({ row: rowNumber, field: 'date', message: 'Date is required' });
      } else {
        // Try to parse the date
        const dateFormats = [
          /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
          /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY or MM/DD/YYYY
          /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
        ];
        
        const isValidFormat = dateFormats.some(format => format.test(row.date));
        if (!isValidFormat) {
          errors.push({ row: rowNumber, field: 'date', message: 'Invalid date format. Use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY' });
        } else {
          // Convert to YYYY-MM-DD format
          let normalizedDate = row.date;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(row.date)) {
            const [d, m, y] = row.date.split('/');
            normalizedDate = `${y}-${m}-${d}`;
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(row.date)) {
            const [d, m, y] = row.date.split('-');
            normalizedDate = `${y}-${m}-${d}`;
          }
          
          if (existingDates.has(normalizedDate)) {
            errors.push({ row: rowNumber, field: 'date', message: 'A holiday already exists on this date' });
          }
          
          // Update the date in the data for import
          row.date = normalizedDate;
        }
      }
    });
    
    return errors;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setCsvFile(file);
      setCsvErrors([]);
    }
  };

  const handleImportCSV = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    try {
      const text = await csvFile.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        toast.error('No valid data found in CSV file');
        setImporting(false);
        return;
      }
      
      const errors = validateCSVData(data);
      
      if (errors.length > 0) {
        setCsvErrors(errors);
        toast.error(`Found ${errors.length} validation error(s). Please review and fix.`);
        setImporting(false);
        return;
      }
      
      // Import all holidays
      let successCount = 0;
      let failCount = 0;
      
      for (const holiday of data) {
        try {
          const res = await fetch('/api/holidays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(holiday),
          });
          
          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch {
          failCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} holiday(s)${failCount > 0 ? `. ${failCount} failed.` : '!'}`);
        setImportDialogOpen(false);
        setCsvFile(null);
        setCsvErrors([]);
        loadHolidays();
      } else {
        toast.error('Failed to import holidays');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse CSV file');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'Holiday Name,Date,Optional\nNew Year\'s Day,2025-01-01,no\nIndependence Day,2025-03-26,no\nOptional Holiday,2025-12-31,yes';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'holidays_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const exportHolidays = () => {
    if (holidays.length === 0) {
      toast.error('No holidays to export');
      return;
    }
    
    const csv = [
      'Holiday Name,Date,Day,Optional',
      ...holidays.map(h => {
        const date = new Date(h.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        return `"${h.name}",${h.date.split('T')[0]},${dayName},${h.isOptional ? 'yes' : 'no'}`;
      })
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays_${new Date().getFullYear()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Holidays exported!');
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Holidays Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage company holidays and optional days off for {new Date().getFullYear()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button variant="outline" size="sm" onClick={exportHolidays}>
              <FileText className="mr-2 h-4 w-4" />
              Export ({holidays.length})
            </Button>
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import Holidays from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to bulk import holidays. Download the template to see the required format.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>CSV File</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    {csvFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {csvFile.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Must include columns: <code className="bg-blue-100 px-1 rounded">Holiday Name</code>, <code className="bg-blue-100 px-1 rounded">Date</code></li>
                      <li>Date format: YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY</li>
                      <li>Optional column: <code className="bg-blue-100 px-1 rounded">Optional</code> (yes/no)</li>
                      <li>First row must be headers</li>
                    </ul>
                  </div>

                  {csvErrors.length > 0 && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4 max-h-48 overflow-y-auto">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-red-900">Validation Errors ({csvErrors.length})</h4>
                          <p className="text-xs text-red-700 mt-1">Please fix these errors and try again</p>
                        </div>
                      </div>
                      <div className="space-y-1 mt-3">
                        {csvErrors.map((error, idx) => (
                          <div key={idx} className="text-sm text-red-800">
                            <span className="font-medium">Row {error.row}</span> ({error.field}): {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setImportDialogOpen(false);
                      setCsvFile(null);
                      setCsvErrors([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleImportCSV} disabled={!csvFile || importing}>
                    {importing ? 'Importing...' : 'Import Holidays'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    ? "Update holiday details below"
                    : "Fill in the details to create a new company holiday"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="required">
                    Holiday Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) {
                        setFormErrors({ ...formErrors, name: '' });
                      }
                    }}
                    placeholder="e.g., New Year's Day, Independence Day"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({ ...formData, date: e.target.value });
                      if (formErrors.date) {
                        setFormErrors({ ...formErrors, date: '' });
                      }
                    }}
                    className={formErrors.date ? 'border-red-500' : ''}
                  />
                  {formErrors.date && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.date}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50 border">
                  <Checkbox
                    id="optional"
                    checked={formData.isOptional}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isOptional: !!checked })
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="optional" className="cursor-pointer font-medium">
                      Mark as Optional Holiday
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Employees can choose whether to observe this holiday
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingHoliday ? "Update Holiday" : "Create Holiday"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Holidays Calendar
              </div>
              <Badge variant="outline" className="font-normal">
                {holidays.length} total
              </Badge>
            </CardTitle>
            <CardDescription>
              View and manage all company holidays
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {holidays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No holidays added yet</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Start by adding a holiday or importing from a CSV file
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Holiday
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Holiday Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.map((holiday) => {
                    const date = new Date(holiday.date);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const isPast = date < new Date();
                    
                    return (
                      <TableRow key={holiday.id} className={isPast ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">{holiday.name}</TableCell>
                        <TableCell>{formatDate(holiday.date)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{dayName}</span>
                        </TableCell>
                        <TableCell>
                          {holiday.isOptional ? (
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Mandatory
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(holiday)}
                              title="Edit holiday"
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
                              title="Delete holiday"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
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

