'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarProvider } from '@prisma/client';
import { Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CalendarConnectionCardProps {
    provider: 'GOOGLE_CALENDAR' | 'OUTLOOK';
    isConnected: boolean;
    lastSyncedAt?: Date | null;
    userId: string;
}

export function CalendarConnectionCard({ provider, isConnected, lastSyncedAt, userId }: CalendarConnectionCardProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleConnect = async () => {
        startTransition(async () => {
            try {
                const endpoint = provider === 'GOOGLE_CALENDAR'
                    ? '/api/calendar/google/auth'
                    : '/api/calendar/outlook/auth';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: JSON.stringify({ userId }), // Ideally handled by session
                });

                if (!response.ok) throw new Error('Failed to initiate auth');

                const { url } = await response.json();
                // Use router.push for OAuth redirects (external URLs still need window.location)
                // For external OAuth URLs, window.location is appropriate
                window.location.href = url;
            } catch (error) {
                console.error(error);
                toast.error('Failed to connect calendar');
            }
        });
    };

    const handleDisconnect = async () => {
        startTransition(async () => {
            try {
                const response = await fetch('/api/calendar/disconnect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, provider }),
                });

                if (!response.ok) throw new Error('Failed to disconnect');

                toast.success('Calendar disconnected');
                // Use router.refresh() instead of window.location.reload()
                router.refresh();
            } catch (error) {
                console.error(error);
                toast.error('Failed to disconnect calendar');
            }
        });
    };

    const providerName = provider === 'GOOGLE_CALENDAR' ? 'Google Calendar' : 'Outlook Calendar';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {providerName}
                </CardTitle>
                <CardDescription>
                    Sync your leave requests with {providerName}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <div className="flex items-center text-green-600 gap-1 text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Connected
                            </div>
                        ) : (
                            <div className="flex items-center text-muted-foreground gap-1 text-sm">
                                <XCircle className="h-4 w-4" />
                                Not Connected
                            </div>
                        )}
                    </div>
                    
                    {isConnected ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDisconnect}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disconnect'}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleConnect}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                        </Button>
                    )}
                </div>
                {isConnected && lastSyncedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Last synced: {new Date(lastSyncedAt).toLocaleString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
