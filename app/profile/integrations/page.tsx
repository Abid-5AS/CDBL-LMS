'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarStatus {
  provider: 'GOOGLE' | 'OUTLOOK';
  providerAccountId: string;
  createdAt: string;
}

interface StatusResponse {
  google: CalendarStatus | null;
  outlook: CalendarStatus | null;
}

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusResponse>({ google: null, outlook: null });

  useEffect(() => {
    fetchStatus();

    // Handle query params for notifications
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_connected') {
      toast.success('Google Calendar connected successfully');
      router.replace('/profile/integrations');
    } else if (success === 'outlook_connected') {
      toast.success('Outlook Calendar connected successfully');
      router.replace('/profile/integrations');
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      router.replace('/profile/integrations');
    }
  }, [searchParams, router]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/calendar/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (provider: 'google' | 'outlook') => {
    window.location.href = `/api/auth/${provider}`;
  };

  const handleDisconnect = async (provider: 'GOOGLE' | 'OUTLOOK') => {
    if (!confirm('Are you sure you want to disconnect this calendar? Future leaves will no longer sync.')) return;

    setDisconnecting(provider);
    try {
      const res = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });

      if (res.ok) {
        toast.success(`${provider === 'GOOGLE' ? 'Google' : 'Outlook'} Calendar disconnected`);
        fetchStatus();
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your external calendars to automatically sync approved leaves.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Google Calendar Card */}
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${status.google ? 'bg-green-500' : 'bg-gray-200'}`} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <CardTitle>Google Calendar</CardTitle>
              </div>
              {status.google ? (
                <Badge variant="default" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </div>
            <CardDescription>
              Sync your approved leaves to your Google Calendar automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.google ? (
              <div className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  Connected as <span className="font-medium text-foreground ml-1">{status.google.providerAccountId}</span>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={() => handleDisconnect('GOOGLE')}
                  disabled={disconnecting === 'GOOGLE'}
                >
                  {disconnecting === 'GOOGLE' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => handleConnect('google')}
              >
                Connect Google Calendar
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Outlook Calendar Card */}
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${status.outlook ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle>Outlook Calendar</CardTitle>
              </div>
              {status.outlook ? (
                <Badge variant="default" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </div>
            <CardDescription>
              Sync your approved leaves to your Microsoft Outlook Calendar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status.outlook ? (
              <div className="space-y-4">
                <div className="flex items-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  Connected as <span className="font-medium text-foreground ml-1">{status.outlook.providerAccountId}</span>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={() => handleDisconnect('OUTLOOK')}
                  disabled={disconnecting === 'OUTLOOK'}
                >
                  {disconnecting === 'OUTLOOK' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => handleConnect('outlook')}
              >
                Connect Outlook Calendar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
