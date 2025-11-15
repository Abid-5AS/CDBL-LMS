"use client";

import * as React from "react";
import {
  Users,
  Search,
  Filter,
  Edit,
  Save,
  X,
  Shield,
  Building2,
  Mail,
  User,
  AlertCircle,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

// ============================================
// Types
// ============================================

interface UserData {
  id: number;
  name: string;
  email: string;
  employeeCode: string;
  role: string;
  department: {
    id: number;
    name: string;
  } | null;
  isActive: boolean;
}

interface Department {
  id: number;
  name: string;
  code: string;
  _count?: {
    users: number;
  };
}

interface EditUserFormData {
  role: string;
  departmentId: number | null;
  isActive: boolean;
}

// ============================================
// User Management Component
// ============================================

export function UserManagement() {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserData | null>(null);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [deptFilter, setDeptFilter] = React.useState("all");

  const [formData, setFormData] = React.useState<EditUserFormData>({
    role: "EMPLOYEE",
    departmentId: null,
    isActive: true,
  });

  // Fetch users and departments
  const fetchData = React.useCallback(async () => {
    try {
      setIsLoading(true);

      const [usersRes, deptsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/departments"),
      ]);

      if (!usersRes.ok || !deptsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [usersData, deptsData] = await Promise.all([
        usersRes.json(),
        deptsRes.json(),
      ]);

      setUsers(usersData.users || []);
      setDepartments(deptsData.departments || []);
    } catch (error) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter users
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesDept =
        deptFilter === "all" ||
        (user.department && user.department.id.toString() === deptFilter);

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, searchTerm, roleFilter, deptFilter]);

  // Open edit dialog
  const handleEditClick = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      role: user.role,
      departmentId: user.department?.id || null,
      isActive: user.isActive,
    });
    setIsDialogOpen(true);
  };

  // Save user changes
  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success("User updated successfully");

      // Refresh users
      await fetchData();
      handleCloseDialog();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
      console.error(error);
    }
  };

  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      role: "EMPLOYEE",
      departmentId: null,
      isActive: true,
    });
  };

  // Get role badge color
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "CEO":
      case "SYSTEM_ADMIN":
        return "destructive";
      case "HR_HEAD":
      case "HR_ADMIN":
        return "default";
      case "DEPT_HEAD":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user roles and department assignments
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or employee code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <Shield className="size-4 mr-2" />
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="DEPT_HEAD">Dept Head</SelectItem>
              <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
              <SelectItem value="HR_HEAD">HR Head</SelectItem>
              <SelectItem value="CEO">CEO</SelectItem>
              <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Filter */}
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[180px]">
              <Building2 className="size-4 mr-2" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info Alert */}
        <Alert className="mb-4">
          <AlertCircle className="size-4" />
          <AlertDescription>
            <strong>Warning:</strong> Changing user roles affects their access
            permissions. Department changes may impact approval workflows.
          </AlertDescription>
        </Alert>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">
                      {user.employeeCode}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.department ? (
                        <span className="text-sm">{user.department.name}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update role and department for{" "}
              <strong>{editingUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Info (Read-only) */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="size-4" />
                <span className="font-medium">{editingUser?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                <span>{editingUser?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{editingUser?.employeeCode}</span>
              </div>
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="DEPT_HEAD">Department Head</SelectItem>
                  <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                  <SelectItem value="HR_HEAD">HR Head</SelectItem>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div>
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.departmentId?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    departmentId: value === "none" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                id="active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="size-4"
              />
              <Label htmlFor="active">Active user</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
