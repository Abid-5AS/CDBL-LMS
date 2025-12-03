"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, X, GitMerge, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { apiFetcher } from '@/lib/apiClient';

interface Conflict {
  id: number;
  conflictType: string;
  hrisData: any;
  systemData: any;
  createdAt: string;
  employee?: {
    id: number;
    empCode: string;
    name: string;
    email: string;
  };
  sync: {
    id: number;
    provider: string;
    startedAt: string;
  };
}

export default function HRISConflictsPage() {
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const { data, error, mutate } = useSWR<{ conflicts: Conflict[] }>(
    '/api/hris/conflicts',
    apiFetcher
  );

  const handleResolve = async (conflictId: number, resolution: string) => {
    setResolvingId(conflictId);

    try {
      const response = await fetch('/api/hris/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflictId, resolution }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Conflict resolved successfully');
        mutate(); // Refresh conflicts list
      } else {
        toast.error(result.error || 'Failed to resolve conflict');
      }
    } catch (error) {
      console.error('Resolution error:', error);
      toast.error('Failed to resolve conflict');
    } finally {
      setResolvingId(null);
    }
  };

  const getConflictBadgeColor = (type: string) => {
    switch (type) {
      case 'duplicate':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'mismatch':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'missing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const renderDataComparison = (conflict: Conflict) => {
    const hrisData = conflict.hrisData;
    const systemData = conflict.systemData;

    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">HRIS Data</h4>
          <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
            {Object.entries(hrisData).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span>{' '}
                <span className="text-muted-foreground">
                  {value ? String(value) : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">System Data</h4>
          <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
            {Object.entries(systemData).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span>{' '}
                <span className="text-muted-foreground">
                  {value ? String(value) : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HRIS Conflicts</h1>
        <p className="text-muted-foreground mt-2">
          Resolve data conflicts between HRIS and system records
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load conflicts. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.conflicts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Check className="h-16 w-16 mx-auto mb-4 text-green-600 opacity-50" />
            <p className="text-lg font-medium">No conflicts to resolve</p>
            <p className="text-sm text-muted-foreground mt-2">
              All HRIS data has been successfully synced
            </p>
          </CardContent>
        </Card>
      )}

      {data && data.conflicts.length > 0 && (
        <div className="space-y-4">
          {data.conflicts.map((conflict) => (
            <Card key={conflict.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      {conflict.employee
                        ? `${conflict.employee.name} (${conflict.employee.empCode})`
                        : `Employee Code: ${conflict.hrisData.empCode}`}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2">
                      <Badge className={getConflictBadgeColor(conflict.conflictType)}>
                        {conflict.conflictType}
                      </Badge>
                      <span className="text-xs">
                        From {conflict.sync.provider.toUpperCase()} sync •{' '}
                        {new Date(conflict.createdAt).toLocaleString()}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderDataComparison(conflict)}

                <div className="flex gap-3 mt-6">
                  <Button
                    size="sm"
                    onClick={() => handleResolve(conflict.id, 'keep_hris')}
                    disabled={resolvingId === conflict.id}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Use HRIS Data
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict.id, 'keep_system')}
                    disabled={resolvingId === conflict.id}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Keep System Data
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict.id, 'skip')}
                    disabled={resolvingId === conflict.id}
                    className="flex items-center gap-2"
                  >
                    <SkipForward className="h-4 w-4" />
                    Skip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
