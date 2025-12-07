"use client";

import { Suspense, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Briefcase,
  Moon,
  Sun,
  Monitor,
  Bell,
  Lock,
  Shield,
  Palette,
  Users,
  Building,
  Hash,
  Check
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { DelegationManagement } from "@/components/admin/DelegationManagement";

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
  const [activeTab, setActiveTab] = useState("general");

  // Mock Notification States
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [browserNotifs, setBrowserNotifs] = useState(false);
  const [marketingNotifs, setMarketingNotifs] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canDelegate = ["DEPT_HEAD", "HR_ADMIN", "HR_HEAD", "CEO", "SYSTEM_ADMIN"].includes(user.role);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex md:grid-cols-none h-auto p-1 bg-muted/50 rounded-xl gap-1">
          <SettingsTabTrigger value="general" icon={User} label="General" />
          <SettingsTabTrigger value="appearance" icon={Palette} label="Appearance" />
          <SettingsTabTrigger value="notifications" icon={Bell} label="Notifications" />
          <SettingsTabTrigger value="security" icon={Shield} label="Security" />
          {canDelegate && (
            <SettingsTabTrigger value="delegation" icon={Users} label="Delegation" />
          )}
        </TabsList>

        <div className="mt-8">
          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 md:grid-cols-12">
              {/* Profile Card */}
              <Card className="md:col-span-8 border-border/50 shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600/20 via-purple-500/20 to-pink-500/20 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40" />
                <CardHeader className="relative pb-0">
                  <div className="absolute -top-16 left-6">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="pt-10 pl-2">
                    <CardTitle className="text-2xl">{user.name}</CardTitle>
                    <CardDescription className="text-base">{user.email}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-6 grid gap-6 sm:grid-cols-2">
                  <ProfileField icon={Briefcase} label="Role" value={formatRole(user.role)} />
                  <ProfileField icon={Building} label="Department" value={user.department || "N/A"} />
                  <ProfileField icon={Hash} label="Employee Code" value={user.empCode || "N/A"} />
                  <ProfileField icon={Mail} label="Email" value={user.email} />
                </CardContent>
              </Card>

              {/* Quick Status / Info Side Card */}
              <Card className="md:col-span-4 border-border/50 shadow-sm h-fit">
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="success" className="bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-green-500/20">
                      Active
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Joined</span>
                    <span className="text-sm font-medium">Nov 2024</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Login</span>
                    <span className="text-sm font-medium">Today</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Theme Preferences</CardTitle>
                <CardDescription>
                  Choose how the application looks properly for your environment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <ThemeCard
                    value="light"
                    current={theme}
                    setTheme={setTheme}
                    icon={Sun}
                    label="Light"
                    previewClass="bg-[#ffffff] border-slate-200"
                  />
                  <ThemeCard
                    value="dark"
                    current={theme}
                    setTheme={setTheme}
                    icon={Moon}
                    label="Dark"
                    previewClass="bg-[#09090b] border-slate-800"
                  />
                  <ThemeCard
                    value="system"
                    current={theme}
                    setTheme={setTheme}
                    icon={Monitor}
                    label="System"
                    previewClass="bg-gradient-to-br from-white to-slate-950 border-slate-400"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you receive alerts and updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-base font-medium">Email Notifications</Label>
                    <span className="text-sm text-muted-foreground">
                      Receive emails about your leave requests and approvals.
                    </span>
                  </div>
                  <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                </div>
                <Separator />
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-base font-medium">Browser Push Notifications</Label>
                    <span className="text-sm text-muted-foreground">
                      Receive instant push notifications in your browser.
                    </span>
                  </div>
                  <Switch checked={browserNotifs} onCheckedChange={setBrowserNotifs} />
                </div>
                <Separator />
                 <div className="flex items-center justify-between space-x-2">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-base font-medium">Marketing & Tips</Label>
                    <span className="text-sm text-muted-foreground">
                      Receive occasional tips on how to use the system better.
                    </span>
                  </div>
                  <Switch checked={marketingNotifs} onCheckedChange={setMarketingNotifs} />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 px-6 py-4">
                <Button 
                  onClick={() => toast.success("Preferences updated")}
                  className="ml-auto"
                >
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Manage your password and security settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" placeholder="••••••••" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" placeholder="••••••••" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" placeholder="••••••••" />
                    </div>
                 </div>
              </CardContent>
               <CardFooter className="bg-muted/30 px-6 py-4 flex justify-between items-center">
                 <p className="text-xs text-muted-foreground">
                   Changing your password will sign you out of all other devices.
                 </p>
                <Button 
                  variant="outline"
                  onClick={() => toast.error("Password change is disabled in demo mode.")}
                >
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
           {/* Delegation Tab */}
           {canDelegate && (
            <TabsContent value="delegation" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <DelegationManagement />
            </TabsContent>
           )}
        </div>
      </Tabs>
    </div>
  );
}

function SettingsTabTrigger({ value, icon: Icon, label }: { value: string; icon: any; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden sr-only">{label}</span>
    </TabsTrigger>
  );
}

function ProfileField({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border/50 transition-colors">
      <div className="p-2 bg-primary/10 rounded-md text-primary shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-0.5">
         <p className="text-xs font-medium text-muted-foreground">{label}</p>
         <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ThemeCard({ value, current, setTheme, icon: Icon, label, previewClass }: any) {
  const isActive = current === value;
  
  return (
    <div 
      onClick={() => setTheme(value)}
      className={`cursor-pointer group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${
        isActive 
          ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
          : "border-muted bg-card hover:border-primary/50"
      }`}
    >
      <div className={`w-full aspect-video rounded-lg border shadow-sm ${previewClass} flex items-center justify-center mb-2 overflow-hidden`}>
         <div className="w-[80%] h-[60%] rounded bg-foreground/10 flex flex-col gap-2 p-2">
            <div className="w-1/2 h-2 rounded bg-foreground/20" />
            <div className="w-full h-2 rounded bg-foreground/10" />
            <div className="w-full h-2 rounded bg-foreground/10" />
         </div>
      </div>
      <div className="flex items-center gap-2 font-medium">
        <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      </div>
      {isActive && (
        <div className="absolute top-3 right-3 text-primary">
          <Check className="w-4 h-4 bg-primary text-primary-foreground rounded-full p-0.5" />
        </div>
      )}
    </div>
  );
}

function formatRole(role: string) {
  const roles: Record<string, string> = {
    HR_ADMIN: "HR Admin",
    HR_HEAD: "Head of HR",
    DEPT_HEAD: "Department Head",
    CEO: "CEO",
    SYSTEM_ADMIN: "System Administrator",
    EMPLOYEE: "Employee",
  };
  return roles[role] || role;
}
