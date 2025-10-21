"use client";

import { useEffect, useState } from "react";
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

export function RequestsTable() {
  const [rows, setRows] = useState<LeaveRow[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/leaves")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load leaves");
        }
        return res.json();
      })
      .then(({ items }) => {
        if (!isMounted) return;
        setRows(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setRows([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
            {rows === null ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  No leave requests yet. Apply your first leave!
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
