'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Activity, CheckCircle2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Webhook {
  id: number;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  createdAt: string;
  _count: {
    deliveries: number;
  };
}

const AVAILABLE_EVENTS = [
  'leave.created',
  'leave.approved',
  'leave.rejected',
  'leave.cancelled',
  'encashment.created',
  'encashment.approved',
  'balance.updated',
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch('/api/webhooks');
      if (!res.ok) throw new Error('Failed to fetch webhooks');
      const data = await res.json();
      setWebhooks(data);
    } catch (error) {
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newWebhook.url || newWebhook.events.length === 0) {
      toast.error('Please provide a URL and select at least one event');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });

      if (!res.ok) throw new Error('Failed to create webhook');

      toast.success('Webhook created successfully');
      setIsCreateOpen(false);
      setNewWebhook({ url: '', events: [], secret: '' });
      fetchWebhooks();
    } catch (error) {
      toast.error('Failed to create webhook');
    } finally {
      setCreating(false);
    }
  };

  const handleTest = async (id: number) => {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      if (!res.ok) throw new Error('Test failed');
      toast.success('Test event sent successfully');
    } catch (error) {
      toast.error('Failed to send test event');
    }
  };

  const toggleEvent = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Manage outgoing webhooks for system events.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Webhook</DialogTitle>
              <DialogDescription>
                Register a new endpoint to receive system events.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">Endpoint URL</Label>
                <Input
                  id="url"
                  placeholder="https://api.example.com/webhooks"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret">Secret (Optional)</Label>
                <Input
                  id="secret"
                  placeholder="Leave blank to auto-generate"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Used to sign requests with HMAC SHA256.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-4">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={event}
                        checked={newWebhook.events.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                      <label
                        htmlFor={event}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {webhooks.length === 0 ? (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Webhooks Configured</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        Create a webhook to start receiving real-time updates for system events.
                    </p>
                </CardContent>
            </Card>
        ) : (
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>URL</TableHead>
                            <TableHead>Events</TableHead>
                            <TableHead>Deliveries</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {webhooks.map((webhook) => (
                            <TableRow key={webhook.id}>
                                <TableCell className="font-medium">
                                    <div className="truncate max-w-[300px]" title={webhook.url}>
                                        {webhook.url}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Secret: <code className="bg-muted px-1 rounded">{webhook.secret.substring(0, 8)}...</code>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {webhook.events.slice(0, 3).map(event => (
                                            <Badge key={event} variant="secondary" className="text-xs">
                                                {event}
                                            </Badge>
                                        ))}
                                        {webhook.events.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{webhook.events.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {webhook._count.deliveries}
                                </TableCell>
                                <TableCell>
                                    {webhook.isActive ? (
                                        <div className="flex items-center text-green-600 text-sm">
                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                            Active
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-muted-foreground text-sm">
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Inactive
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleTest(webhook.id)}>
                                            Test
                                        </Button>
                                        {/* Delete functionality to be implemented */}
                                        <Button variant="ghost" size="icon" className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        )}
      </div>
    </div>
  );
}
