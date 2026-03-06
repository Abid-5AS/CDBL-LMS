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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserManagement } from "@/components/admin/UserManagement";
import { BalanceAdjustment } from "@/components/admin/BalanceAdjustment";
import { BulkLeaveImport } from "@/components/admin/BulkLeaveImport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminToolsContentProps {
  userRole: string;
}

export function AdminToolsContent({ userRole }: AdminToolsContentProps) {
  const canManageUsers = ["CEO", "SYSTEM_ADMIN"].includes(userRole);
  const canManageHolidays = [
    "HR_ADMIN",
    "HR_HEAD",
    "CEO",
    "SYSTEM_ADMIN",
  ].includes(userRole);
  const canViewAnalytics = [
    "HR_ADMIN",
    "HR_HEAD",
    "CEO",
    "SYSTEM_ADMIN",
  ].includes(userRole);
  const canAdjustBalances = ["SYSTEM_ADMIN"].includes(userRole);
  const canImportLeaves = ["HR_ADMIN", "HR_HEAD", "SYSTEM_ADMIN"].includes(userRole);

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
            className="neo-card group block p-6 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-foreground">
                  Leave Analytics
                </h3>
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
          className="neo-card group block p-6 cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BookOpen className="size-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">
                Leave Policies
              </h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive policy documentation for all leave types
              </p>
            </div>
          </div>
        </Link>

        {/* FAQ */}
        <Link href="/faq" className="neo-card group block p-6 cursor-pointer">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <HelpCircle className="size-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">FAQ & Help</h3>
              <p className="text-sm text-muted-foreground">
                Frequently asked questions and quick help resources
              </p>
            </div>
          </div>
        </Link>

        {/* Employees */}
        <Link
          href="/employees"
          className="neo-card group block p-6 cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Users className="size-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">
                Employee Directory
              </h3>
              <p className="text-sm text-muted-foreground">
                Browse all employees, balances, and leave history
              </p>
            </div>
          </div>
        </Link>

        {/* Audit Logs */}
        <Link
          href="/admin/audit"
          className="neo-card group block p-6 cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Shield className="size-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">Audit Logs</h3>
              <p className="text-sm text-muted-foreground">
                Review system activity and administrative actions
              </p>
            </div>
          </div>
        </Link>

        {/* Approvals */}
        <Link
          href="/approvals"
          className="neo-card group block p-6 cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="size-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-foreground">
                Pending Approvals
              </h3>
              <p className="text-sm text-muted-foreground">
                Review and process leave approval requests
              </p>
            </div>
          </div>
        </Link>

        {/* Balance Management */}
        {canAdjustBalances && (
          <Link
            href="/admin/balance"
            className="neo-card group block p-6 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <TrendingUp className="size-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-foreground">
                  Balance Management
                </h3>
                <p className="text-sm text-muted-foreground">
                  View all employee balances, import/export, and adjust
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Holiday Calendar */}
        {canManageHolidays && (
          <Link
            href="/admin/holidays"
            className="neo-card group block p-6 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-teal-500/10">
                <Calendar className="size-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-foreground">
                  Holiday Calendar
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage holidays, CSV import/export, and calendar settings
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Management Tools */}
      <Tabs
        defaultValue={
          canManageUsers ? "users" : canManageHolidays ? "holidays" : canImportLeaves ? "leaves" : "balances"
        }
        className="w-full"
      >
        <TabsList
          className={`grid w-full ${
            [canManageUsers, canManageHolidays, canAdjustBalances, canImportLeaves].filter(Boolean).length === 4
              ? "grid-cols-4"
              : [canManageUsers, canManageHolidays, canAdjustBalances, canImportLeaves].filter(Boolean).length === 3
                ? "grid-cols-3"
                : [canManageUsers, canManageHolidays, canAdjustBalances, canImportLeaves].filter(Boolean).length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
          }`}
        >
          {canManageUsers && (
            <TabsTrigger value="users">User Management</TabsTrigger>
          )}
          {canManageHolidays && (
            <TabsTrigger value="holidays">Holiday Calendar</TabsTrigger>
          )}
          {canImportLeaves && (
            <TabsTrigger value="leaves">Bulk Leave Import</TabsTrigger>
          )}
          {canAdjustBalances && (
            <TabsTrigger value="balances">Balance Adjustment</TabsTrigger>
          )}
        </TabsList>

        {canManageUsers && (
          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>
        )}

        {canManageHolidays && (
          <TabsContent value="holidays" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  Holiday Calendar Management
                </CardTitle>
                <CardDescription>
                  Manage holidays, import from CSV, and configure the holiday calendar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/holidays">
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Open Holiday Management
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canImportLeaves && (
          <TabsContent value="leaves" className="mt-6">
            <BulkLeaveImport />
          </TabsContent>
        )}

        {canAdjustBalances && (
          <TabsContent value="balances" className="mt-6">
            <BalanceAdjustment />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
