"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, RefreshCw, AlertCircle, CheckCircle, Clock, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiFetcher } from '@/lib/apiClient';

interface SyncHistory {
  id: number;
  provider: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  recordsTotal: number;
  recordsSynced: number;
  recordsFailed: number;
  unresolvedConflicts: number;
  user: {
    name: string;
    email: string;
  };
}

export default function HRISIntegrationPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [syncing, setSyncing] = useState(false);

  const { data, error, mutate } = useSWR<{ syncs: SyncHistory[] }>(
    '/api/hris/sync',
    apiFetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSync = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setSyncing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/hris/sync', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `Sync completed! ${result.result.recordsSynced} employees synced, ${result.result.recordsFailed} failed, ${result.result.conflicts.length} conflicts detected.`
        );
        setFile(null);
        mutate(); // Refresh sync history
      } else {
        toast.error(result.error || 'Failed to sync HRIS data');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync HRIS data');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HRIS Integration</h1>
        <p className="text-muted-foreground mt-2">
          Import and synchronize employee data from your HRIS system
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Employee Data
          </CardTitle>
          <CardDescription>
            Upload a CSV or Excel file containing employee information to sync with the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Select File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">File Format Requirements:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Required columns: empCode, name, email</li>
              <li>• Optional columns: department, joinDate, retirementDate, status</li>
              <li>• Supported formats: CSV (.csv), Excel (.xlsx, .xls)</li>
              <li>• First row must contain column headers</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSync}
              disabled={!file || syncing}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Start Sync
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/admin/hris/conflicts')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              View Conflicts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sync History
          </CardTitle>
          <CardDescription>Recent employee data synchronizations</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-sm text-red-600">Failed to load sync history</div>
          )}

          {data && data.syncs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sync history yet. Upload a file to get started.</p>
            </div>
          )}

          {data && data.syncs.length > 0 && (
            <div className="space-y-3">
              {data.syncs.map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {getStatusIcon(sync.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {sync.provider.toUpperCase()} Import
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            sync.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : sync.status === 'failed'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          {sync.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        By {sync.user.name} •{' '}
                        {new Date(sync.startedAt).toLocaleString()}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Total: {sync.recordsTotal}
                        </span>
                        <span className="text-green-600">
                          Synced: {sync.recordsSynced}
                        </span>
                        {sync.recordsFailed > 0 && (
                          <span className="text-red-600">
                            Failed: {sync.recordsFailed}
                          </span>
                        )}
                        {sync.unresolvedConflicts > 0 && (
                          <span className="text-orange-600">
                            Conflicts: {sync.unresolvedConflicts}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {sync.unresolvedConflicts > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/admin/hris/conflicts')}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
