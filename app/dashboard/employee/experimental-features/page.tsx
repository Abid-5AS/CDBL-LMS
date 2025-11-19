"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Bell,
  TrendingUp,
  Settings,
  Moon,
  Sun,
  Activity,
  Clock,
  Users,
  Search,
  Download,
  Share2,
  ChevronRight,
  MapPin,
  Coffee,
  Eye,
  FileText,
  MessageSquare,
  Heart,
  Star,
  Zap,
  Globe,
  Smartphone,
  BarChart3
} from "lucide-react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Sample experimental components
const LeaveCalendarPreview = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Leave Calendar Preview
      </CardTitle>
      <CardDescription>Visual calendar showing approved leaves</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="bg-muted rounded-lg p-4 h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Calendar visualization component</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const NotificationPreferences = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Notification Preferences
      </CardTitle>
      <CardDescription>Customize your notification settings</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Push Notifications</span>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <span>Email Reminders</span>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <span>SMS Alerts</span>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <span>Weekly Digest</span>
          <Switch />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const AnalyticsDashboard = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Leave Analytics
      </CardTitle>
      <CardDescription>Your leave patterns and trends</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="bg-muted rounded-lg p-4 h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Analytics visualization component</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          Theme Preferences
        </CardTitle>
        <CardDescription>Customize your interface appearance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button
            variant={theme === 'light' ? "default" : "outline"}
            onClick={() => setTheme("light")}
          >
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? "default" : "outline"}
            onClick={() => setTheme("dark")}
          >
            Dark
          </Button>
          <Button
            variant={theme === 'system' ? "default" : "outline"}
            onClick={() => setTheme("system")}
          >
            System
          </Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Badge variant="secondary">Feature Status: Experimental</Badge>
          <Badge variant="outline">Needs Feedback</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityFeed = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        Recent Activity
      </CardTitle>
      <CardDescription>Your latest leave-related activities</CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-64 w-full rounded-md border p-4">
        <div className="space-y-4">
          {[
            { id: 1, action: "Leave request approved", time: "2 hours ago", type: "success" },
            { id: 2, action: "New leave request submitted", time: "1 day ago", type: "info" },
            { id: 3, action: "Leave balance updated", time: "3 days ago", type: "info" },
            { id: 4, action: "System maintenance notice", time: "1 week ago", type: "warning" },
            { id: 5, action: "Policy update notification", time: "2 weeks ago", type: "info" },
            { id: 6, action: "Holiday calendar updated", time: "3 weeks ago", type: "info" },
          ].map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p>{item.action}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const TeamLeaveOverview = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Team Leave Overview
      </CardTitle>
      <CardDescription>Leave status of your team members</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[
          { name: "John Doe", leaveType: "EL", dates: "Mar 15-17, 2025", status: "Approved" },
          { name: "Jane Smith", leaveType: "CL", dates: "Mar 20-21, 2025", status: "Pending" },
          { name: "Robert Johnson", leaveType: "ML", dates: "Apr 5-10, 2025", status: "Approved" },
          { name: "Sarah Williams", leaveType: "EL", dates: "Apr 12-15, 2025", status: "Pending" },
        ].map((member, index) => (
          <div key={index} className="flex items-center justify-between border-b pb-2">
            <div>
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.leaveType} | {member.dates}</p>
            </div>
            <Badge variant={member.status === "Approved" ? "default" : "secondary"}>
              {member.status}
            </Badge>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

// New experimental components
const QuickActionCenter = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Zap className="h-5 w-5" />
        Quick Actions
      </CardTitle>
      <CardDescription>One-click access to common tasks</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="flex flex-col items-center gap-2 p-4 h-24">
          <Calendar className="h-6 w-6" />
          Apply Leave
        </Button>
        <Button variant="outline" className="flex flex-col items-center gap-2 p-4 h-24">
          <FileText className="h-6 w-6" />
          View Report
        </Button>
        <Button variant="outline" className="flex flex-col items-center gap-2 p-4 h-24">
          <Bell className="h-6 w-6" />
          Notifications
        </Button>
        <Button variant="outline" className="flex flex-col items-center gap-2 p-4 h-24">
          <Globe className="h-6 w-6" />
          Holiday Calendar
        </Button>
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const LeaveBalanceVisualization = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Leave Balance Visualization
      </CardTitle>
      <CardDescription>Visual representation of your leave balances</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[
          { type: "Earned Leave", used: 12, total: 20, color: "bg-blue-500" },
          { type: "Casual Leave", used: 4, total: 10, color: "bg-green-500" },
          { type: "Medical Leave", used: 2, total: 14, color: "bg-purple-500" },
        ].map((leave, index) => (
          <div key={index}>
            <div className="flex justify-between mb-1">
              <span>{leave.type}</span>
              <span>{leave.used}/{leave.total} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`${leave.color} h-2.5 rounded-full`}
                style={{ width: `${(leave.used / leave.total) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const SearchEnhancements = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Search className="h-5 w-5" />
        Advanced Search
      </CardTitle>
      <CardDescription>Enhanced search with filters and suggestions</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Search leaves, employees, reports..." />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="cursor-pointer">Last 7 days</Badge>
          <Badge variant="outline" className="cursor-pointer">Approved</Badge>
          <Badge variant="outline" className="cursor-pointer">Pending</Badge>
          <Badge variant="outline" className="cursor-pointer">Earned Leave</Badge>
          <Badge variant="outline" className="cursor-pointer">Casual Leave</Badge>
        </div>
        <div className="mt-4">
          <h4 className="font-medium mb-2">Recent Searches</h4>
          <div className="space-y-1">
            {["My pending leaves", "Team leave report", "Holidays this month"].map((search, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded hover:bg-muted">
                <Search className="h-4 w-4" />
                {search}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const FeedbackWidget = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Feedback Widget
      </CardTitle>
      <CardDescription>Quickly submit feedback on any feature</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="h-6 w-6 fill-gray-200 text-gray-200 hover:text-yellow-400 cursor-pointer" />
          ))}
        </div>
        <textarea
          className="w-full p-2 border rounded-md min-h-[100px]"
          placeholder="Tell us what you think about this feature..."
        ></textarea>
        <div className="flex justify-between">
          <Button variant="outline">Submit Feedback</Button>
          <Button variant="outline" size="sm">Report Issue</Button>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const MobileOptimizations = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Smartphone className="h-5 w-5" />
        Mobile Enhancements
      </CardTitle>
      <CardDescription>Features optimized for mobile devices</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p>Mobile-optimized calendar</p>
            <p className="text-xs text-muted-foreground">Calendar with touch-friendly interactions</p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p>Offline mode</p>
            <p className="text-xs text-muted-foreground">Access basic features without internet</p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p>Quick apply shortcuts</p>
            <p className="text-xs text-muted-foreground">One-tap leave applications</p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p>Biometric login</p>
            <p className="text-xs text-muted-foreground">Fingerprint/face unlock</p>
          </div>
          <Switch disabled />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Badge variant="secondary">Feature Status: Experimental</Badge>
        <Badge variant="outline">Needs Feedback</Badge>
      </div>
    </CardContent>
  </Card>
);

const ExperimentalFeaturesPage = () => {
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Experimental Features</h1>
        <p className="text-muted-foreground mt-2">
          Test new features and provide feedback. These features are experimental and may change based on user feedback.
        </p>
      </div>

      <div className="mb-6">
        <Badge variant="outline" className="text-lg py-1 px-3">
          Experimental
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="mobile">Mobile</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <LeaveCalendarPreview />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationPreferences />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <ThemeSwitcher />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityFeed />
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamLeaveOverview />
        </TabsContent>

        <TabsContent value="quick-actions" className="mt-6">
          <QuickActionCenter />
        </TabsContent>

        <TabsContent value="balance" className="mt-6">
          <LeaveBalanceVisualization />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <SearchEnhancements />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <FeedbackWidget />
        </TabsContent>

        <TabsContent value="mobile" className="mt-6">
          <MobileOptimizations />
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Feedback Requested
        </h3>
        <p className="text-yellow-700 mt-2">
          These experimental features are under development. Please provide feedback through the feedback button at the top right of the page.
          Based on your feedback, we'll decide which features to implement permanently or improve further.
        </p>
      </div>
    </div>
  );
};

export default ExperimentalFeaturesPage;