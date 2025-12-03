"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function CalendarSettingsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [configs, setConfigs] = useState<any[]>([]);

    useEffect(() => {
        // Handle OAuth callbacks
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        if (success) {
            toast.success("Calendar connected successfully!");
            router.replace("/settings/calendar");
        }

        if (error) {
            toast.error(`Connection failed: ${error}`);
            router.replace("/settings/calendar");
        }

        fetchConfigs();
    }, [searchParams, router]);

    const fetchConfigs = async () => {
        try {
            const res = await fetch("/api/integrations/calendar/status");
            if (res.ok) {
                const data = await res.json();
                setConfigs(data);
            }
        } catch (error) {
            console.error("Failed to fetch calendar configs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const res = await fetch("/api/integrations/calendar/auth/google/url");
            const data = await res.json();
            window.location.href = data.url;
        } catch (error) {
            toast.error("Failed to initiate Google connection");
        }
    };

    const handleConnectOutlook = async () => {
        try {
            const res = await fetch("/api/integrations/calendar/auth/outlook/url");
            const data = await res.json();
            window.location.href = data.url;
        } catch (error) {
            toast.error("Failed to initiate Outlook connection");
        }
    };

    const handleDisconnect = async (provider: string) => {
        try {
            const res = await fetch(`/api/integrations/calendar/disconnect?provider=${provider}`, {
                method: "POST",
            });
            if (res.ok) {
                toast.success(`${provider} disconnected`);
                fetchConfigs();
            } else {
                toast.error("Failed to disconnect");
            }
        } catch (error) {
            toast.error("Error disconnecting calendar");
        }
    };

    const googleConfig = configs.find((c) => c.provider === "GOOGLE");
    const outlookConfig = configs.find((c) => c.provider === "OUTLOOK");

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Calendar Integration</h3>
                <p className="text-sm text-muted-foreground">
                    Connect your external calendars to automatically sync approved leaves.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Google Calendar Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Google Calendar
                        </CardTitle>
                        <CardDescription>
                            Sync your leaves to your Google Calendar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {googleConfig?.isActive ? (
                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                        <CheckCircle className="mr-1 h-3 w-3" /> Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        <XCircle className="mr-1 h-3 w-3" /> Not Connected
                                    </Badge>
                                )}
                            </div>
                            {googleConfig?.isActive ? (
                                <Button variant="destructive" size="sm" onClick={() => handleDisconnect("GOOGLE")}>
                                    Disconnect
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
                                    Connect
                                </Button>
                            )}
                        </div>
                        {googleConfig && (
                            <div className="text-xs text-muted-foreground">
                                Last synced: {googleConfig.lastSyncAt ? new Date(googleConfig.lastSyncAt).toLocaleString() : "Never"}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Outlook Calendar Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-700" />
                            Outlook Calendar
                        </CardTitle>
                        <CardDescription>
                            Sync your leaves to your Outlook Calendar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {outlookConfig?.isActive ? (
                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                        <CheckCircle className="mr-1 h-3 w-3" /> Connected
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        <XCircle className="mr-1 h-3 w-3" /> Not Connected
                                    </Badge>
                                )}
                            </div>
                            {outlookConfig?.isActive ? (
                                <Button variant="destructive" size="sm" onClick={() => handleDisconnect("OUTLOOK")}>
                                    Disconnect
                                </Button>
                            ) : (
                                <Button variant="outline" size="sm" onClick={handleConnectOutlook}>
                                    Connect
                                </Button>
                            )}
                        </div>
                        {outlookConfig && (
                            <div className="text-xs text-muted-foreground">
                                Last synced: {outlookConfig.lastSyncAt ? new Date(outlookConfig.lastSyncAt).toLocaleString() : "Never"}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <ExternalLink className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">How it works</p>
                        <p className="text-xs text-muted-foreground">
                            When you connect a calendar, approved leave requests will automatically be added as "Out of Office" events.
                            If you cancel a leave, the event will be removed.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
