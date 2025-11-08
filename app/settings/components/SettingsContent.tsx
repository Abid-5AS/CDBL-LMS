"use client";

import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, Mail, Briefcase, Moon, Sun, Monitor } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SettingsContentProps = {
  user: {
    name: string | null;
    email: string;
    role: string;
    department: string | null;
    empCode: string | null;
  };
};

export function SettingsContent({ user }: SettingsContentProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details (read-only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-data-info dark:bg-data-info flex items-center justify-center">
              <User className="h-6 w-6 text-data-info dark:text-data-info" />
            </div>
            <div>
              <p className="font-medium text-text-secondary dark:text-text-secondary">{user.name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                Role
              </Label>
              <p className="text-sm font-medium capitalize">
                {user.role === "HR_ADMIN" ? "HR Admin" : user.role === "HR_HEAD" ? "HR Head" : user.role === "DEPT_HEAD" ? "Manager" : user.role === "CEO" ? "CEO" : "Employee"}
              </p>
            </div>
            {user.department && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Department</Label>
                <p className="text-sm font-medium">{user.department}</p>
              </div>
            )}
            {user.empCode && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Employee Code</Label>
                <p className="text-sm font-medium">{user.empCode}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the application looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme">Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            {mounted ? (
              <Select value={theme} onValueChange={(value) => setTheme(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="h-9 w-[180px] bg-bg-secondary dark:bg-bg-secondary rounded animate-pulse" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Notification preferences will be available in a future update. For now, you'll receive email notifications for leave approvals and rejections.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Password management will be available in a future update. Please contact HR for password changes.
          </p>
          <Button variant="outline" disabled>
            Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

