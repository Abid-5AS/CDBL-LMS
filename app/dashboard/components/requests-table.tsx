"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "./status-badge";

type LeaveRow = {
  id: string;
  type: "EL" | "CL" | "ML" | "EWP" | "EWO" | "MAT" | "PAT";
  start: string;
  end: string;
  requestedDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  updatedAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RequestsTable() {
  const { data, isLoading, error } = useSWR("/api/leaves?mine=1", fetcher, {
    revalidateOnFocus: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Requests</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Working Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-red-600 py-8">
                  Failed to load
                </TableCell>
              </TableRow>
            ) : !Array.isArray(data?.leaves) || data.leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  No leave requests yet. Apply your first leave!
                </TableCell>
              </TableRow>
            ) : (
              data.leaves.map((row: LeaveRow) => (
                <TableRow key={row.id}>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>
                    {new Date(row.start).toLocaleDateString()} → {new Date(row.end).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{row.requestedDays}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{new Date(row.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <button className="text-sm text-primary">View</button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
