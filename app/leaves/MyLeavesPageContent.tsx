"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  Plus,
  Search,
  XCircle,
  AlertCircle,
  LayoutGrid,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import EnhancedSmoothTab from "@/components/ui/enhanced-smooth-tab";

import { LeaveBalanceView } from "@/components/leaves/LeaveBalanceView";
import { HolidayCalendarView } from "@/components/leaves/HolidayCalendarView";
import { useLeaveData } from "@/components/providers";
import { cn } from "@/lib/utils";
import { Wallet, ClipboardList } from "lucide-react";

function formatLeaveType(type: string) {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function LeaveRequestCard({ request }: { request: any }) {
  const statusColors = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    APPROVED: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
    REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    CANCELLED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
    RETURNED: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  };

  const statusIcons = {
    PENDING: Clock,
    APPROVED: CheckCircle2,
    REJECTED: XCircle,
    CANCELLED: XCircle,
    RETURNED: AlertCircle,
  };

  const StatusIcon = statusIcons[request.status as keyof typeof statusIcons] || Clock;
  const statusColor = statusColors[request.status as keyof typeof statusColors] || statusColors.PENDING;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md dark:hover:border-primary/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
            statusColor
          )}>
            <StatusIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">
                {formatLeaveType(request.type)}
              </h3>
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                statusColor
              )}>
                {request.status}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(request.startDate), "MMM d, yyyy")} -{" "}
                {format(new Date(request.endDate), "MMM d, yyyy")}
              </span>
              <span className="text-xs">•</span>
              <span>{request.days} days</span>
            </div>
            {request.reason && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                {request.reason}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RequestsView() {
  const router = useRouter();
  const { data, error, isLoading } = useLeaveData();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const tabs = [
    {
      id: "all",
      title: "All",
      color: "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600",
    },
    {
      id: "pending",
      title: "Under Review",
      color: "bg-info/80 hover:bg-info dark:bg-info/70 dark:hover:bg-info/80",
    },
    {
      id: "approved",
      title: "Approved",
      color: "bg-success/80 hover:bg-success dark:bg-success/70 dark:hover:bg-success/80",
    },
    {
      id: "rejected",
      title: "Rejected",
      color: "bg-danger/80 hover:bg-danger dark:bg-danger/70 dark:hover:bg-danger/80",
    },
    {
      id: "cancelled",
      title: "Cancelled",
      color: "bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-600 dark:hover:bg-zinc-500",
    },
  ];

  const filteredRequests = data?.items?.filter((item: any) => {
    const matchesTab = activeTab === "all" || item.status.toLowerCase() === activeTab;
    const matchesSearch = item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  }) || [];



  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="hidden sm:flex"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>

          <Button onClick={() => router.push("/leaves/apply")} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      <EnhancedSmoothTab
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        className="w-full max-w-4xl mx-auto"
      />

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-destructive font-medium">Failed to load requests</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No requests found</h3>
            <p className="text-muted-foreground">
              {activeTab === "all"
                ? "You haven't made any leave requests yet."
                : `No ${activeTab} requests found.`}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "calendar" ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                  Calendar view coming soon
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filteredRequests.map((request: any) => (
                      <LeaveRequestCard key={request.id} request={request} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export function MyLeavesPageContent() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Leaves</h1>
        <p className="text-muted-foreground">
          Manage your leave requests, check balances, and view the holiday calendar.
        </p>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="requests" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-2">
            <Wallet className="h-4 w-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2">
            <Calendar className="h-4 w-4" />
            Holidays
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6 outline-none">
          <RequestsView />
        </TabsContent>

        <TabsContent value="balances" className="outline-none">
          <LeaveBalanceView />
        </TabsContent>

        <TabsContent value="holidays" className="outline-none">
          <HolidayCalendarView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
