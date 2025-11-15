"use client";

import * as React from "react";
import Link from "next/link";
import {
  Settings,
  Calendar,
  BarChart3,
  Users,
  BookOpen,
  HelpCircle,
  Shield,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HolidayCalendarManager } from "@/components/admin/HolidayCalendarManager";
import { UserManagement } from "@/components/admin/UserManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminToolsContentProps {
  userRole: string;
}

export function AdminToolsContent({ userRole }: AdminToolsContentProps) {
  const canManageUsers = ["CEO", "SYSTEM_ADMIN"].includes(userRole);
  const canManageHolidays = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(userRole);
  const canViewAnalytics = ["HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="size-8 text-primary" />
          Admin Tools
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage system settings, users, and access advanced features
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Analytics */}
        {canViewAnalytics && (
          <Link
            href="/reports"
            className="block p-6 rounded-lg border border-border hover:bg-accent transition-colors hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Leave Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View trends, department utilization, and detailed reports
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Policies */}
        <Link
          href="/policies"
          className="block p-6 rounded-lg border border-border hover:bg-accent transition-colors hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BookOpen className="size-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Leave Policies</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive policy documentation for all leave types
              </p>
            </div>
          </div>
        </Link>

        {/* FAQ */}
        <Link
          href="/faq"
          className="block p-6 rounded-lg border border-border hover:bg-accent transition-colors hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <HelpCircle className="size-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">FAQ & Help</h3>
              <p className="text-sm text-muted-foreground">
                Frequently asked questions and quick help resources
              </p>
            </div>
          </div>
        </Link>

        {/* Employees */}
        <Link
          href="/employees"
          className="block p-6 rounded-lg border border-border hover:bg-accent transition-colors hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Users className="size-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Employee Directory</h3>
              <p className="text-sm text-muted-foreground">
                Browse all employees, balances, and leave history
              </p>
            </div>
          </div>
        </Link>

        {/* Audit Logs */}
        <Link
          href="/admin/audit"
          className="block p-6 rounded-lg border border-border hover:bg-accent transition-colors hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Shield className="size-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Audit Logs</h3>
              <p className="text-sm text-muted-foreground">
                Review system activity and administrative actions
              </p>
            </div>
          </div>
        </Link>

        {/* Approvals */}
        <Link
          href="/approvals"
          className="block p-6 rounded-lg border border-border hover:bg-accent transition-colors hover:shadow-md"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="size-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Pending Approvals</h3>
              <p className="text-sm text-muted-foreground">
                Review and process leave approval requests
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Management Tools */}
      <Tabs defaultValue={canManageUsers ? "users" : "holidays"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {canManageUsers && <TabsTrigger value="users">User Management</TabsTrigger>}
          {canManageHolidays && <TabsTrigger value="holidays">Holiday Calendar</TabsTrigger>}
        </TabsList>

        {canManageUsers && (
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
        )}

        {canManageHolidays && (
          <TabsContent value="holidays" className="mt-6">
            <HolidayCalendarManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
