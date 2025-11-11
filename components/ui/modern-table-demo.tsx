"use client";

import { useState, useMemo } from "react";
import { ModernTable, Button } from "@/components/ui";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  Building,
} from "lucide-react";

// Sample data type
interface LeaveRequest {
  id: string;
  employeeName: string;
  department: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  reason: string;
  submittedAt: string;
}

// Sample data
const sampleData: LeaveRequest[] = [
  {
    id: "1",
    employeeName: "John Smith",
    department: "Engineering",
    type: "Earned Leave",
    startDate: "2025-12-01",
    endDate: "2025-12-03",
    days: 3,
    status: "pending",
    reason: "Family vacation",
    submittedAt: "2025-11-10",
  },
  {
    id: "2",
    employeeName: "Sarah Johnson",
    department: "Marketing",
    type: "Sick Leave",
    startDate: "2025-11-15",
    endDate: "2025-11-15",
    days: 1,
    status: "approved",
    reason: "Medical appointment",
    submittedAt: "2025-11-09",
  },
  {
    id: "3",
    employeeName: "Mike Chen",
    department: "Finance",
    type: "Casual Leave",
    startDate: "2025-11-20",
    endDate: "2025-11-22",
    days: 3,
    status: "rejected",
    reason: "Personal work",
    submittedAt: "2025-11-08",
  },
  {
    id: "4",
    employeeName: "Emily Davis",
    department: "HR",
    type: "Earned Leave",
    startDate: "2025-12-15",
    endDate: "2025-12-20",
    days: 6,
    status: "returned",
    reason: "Holiday trip",
    submittedAt: "2025-11-07",
  },
];

// Status badge component
const StatusBadge = ({ status }: { status: LeaveRequest['status'] }) => {
  const config = {
    pending: { 
      icon: Clock, 
      label: "Pending", 
      className: "bg-amber-50 text-amber-700 border-amber-200" 
    },
    approved: { 
      icon: CheckCircle2, 
      label: "Approved", 
      className: "bg-green-50 text-green-700 border-green-200" 
    },
    rejected: { 
      icon: XCircle, 
      label: "Rejected", 
      className: "bg-red-50 text-red-700 border-red-200" 
    },
    returned: { 
      icon: AlertTriangle, 
      label: "Returned", 
      className: "bg-blue-50 text-blue-700 border-blue-200" 
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
};

/**
 * Modern Table Demo Component
 * Showcases the new ModernTable component with all features:
 * - Card wrapper with header
 * - Row selection
 * - Sorting
 * - Action buttons
 * - Responsive design
 */
export function ModernTableDemo() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return sampleData;
    
    return [...sampleData].sort((a, b) => {
      const aValue = a[sortColumn as keyof LeaveRequest];
      const bValue = b[sortColumn as keyof LeaveRequest];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [sortColumn, sortDirection]);

  // Handle row selection
  const handleRowSelection = (rowId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, rowId]);
    } else {
      setSelectedRows(selectedRows.filter(id => id !== rowId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(sortedData.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  // Bulk actions
  const handleBulkApprove = () => {
    console.log('Bulk approve:', selectedRows);
    // Implement bulk approve logic
    setSelectedRows([]);
  };

  const handleBulkReject = () => {
    console.log('Bulk reject:', selectedRows);
    // Implement bulk reject logic
    setSelectedRows([]);
  };

  return (
    <div className="space-y-6">
      {/* Table Card with Header */}
      <ModernTable.Card.Root>
        <ModernTable.Card.Header
          title="Leave Requests"
          badge={`${sortedData.length} total`}
          description="Review and manage employee leave applications"
          contentTrailing={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                Add Request
              </Button>
            </div>
          }
        />

        {/* Bulk Actions Bar */}
        {selectedRows.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 bg-bg-secondary border-b border-border-strong">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>{selectedRows.length} selected</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedRows([])}
                className="h-6 px-2"
              >
                Clear
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkApprove}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkReject}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject All
              </Button>
            </div>
          </div>
        )}

        {/* Modern Table */}
        <ModernTable 
          size="md" 
          enableSelection={true}
          onSelectionChange={setSelectedRows}
        >
          <ModernTable.Header
            enableSelection={true}
            selectedCount={selectedRows.length}
            totalCount={sortedData.length}
            onSelectAll={handleSelectAll}
            bordered={true}
          >
            <ModernTable.Head 
              label="EMPLOYEE"
              sortable={true}
              sortDirection={sortColumn === 'employeeName' ? sortDirection : null}
              onSort={() => handleSort('employeeName')}
            />
            <ModernTable.Head label="DEPARTMENT" />
            <ModernTable.Head 
              label="TYPE"
              sortable={true}
              sortDirection={sortColumn === 'type' ? sortDirection : null}
              onSort={() => handleSort('type')}
            />
            <ModernTable.Head label="DATES" />
            <ModernTable.Head 
              label="DAYS"
              sortable={true}
              sortDirection={sortColumn === 'days' ? sortDirection : null}
              onSort={() => handleSort('days')}
              className="text-center"
            />
            <ModernTable.Head 
              label="STATUS"
              sortable={true}
              sortDirection={sortColumn === 'status' ? sortDirection : null}
              onSort={() => handleSort('status')}
            />
            <ModernTable.Head label="ACTION" className="text-center" />
          </ModernTable.Header>

          <ModernTable.Body>
            {sortedData.map((request) => (
              <ModernTable.Row
                key={request.id}
                rowId={request.id}
                enableSelection={true}
                isSelected={selectedRows.includes(request.id)}
                onSelectionChange={handleRowSelection}
                highlightSelectedRow={true}
              >
                {/* Employee Info */}
                <ModernTable.Cell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary">
                      <User className="h-4 w-4 text-text-tertiary" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {request.employeeName}
                      </div>
                      <div className="text-xs text-text-tertiary">
                        ID: EMP{request.id.padStart(3, '0')}
                      </div>
                    </div>
                  </div>
                </ModernTable.Cell>

                {/* Department */}
                <ModernTable.Cell>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-text-tertiary" />
                    <span className="text-text-secondary">{request.department}</span>
                  </div>
                </ModernTable.Cell>

                {/* Leave Type */}
                <ModernTable.Cell>
                  <div className="font-medium text-text-secondary">
                    {request.type}
                  </div>
                </ModernTable.Cell>

                {/* Dates */}
                <ModernTable.Cell>
                  <div className="text-sm">
                    <div className="text-text-secondary">
                      {new Date(request.startDate).toLocaleDateString('en-GB')}
                    </div>
                    {request.startDate !== request.endDate && (
                      <div className="text-text-tertiary text-xs">
                        to {new Date(request.endDate).toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>
                </ModernTable.Cell>

                {/* Days */}
                <ModernTable.Cell className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bg-tertiary text-sm font-medium text-text-secondary">
                    {request.days}
                  </div>
                </ModernTable.Cell>

                {/* Status */}
                <ModernTable.Cell>
                  <StatusBadge status={request.status} />
                </ModernTable.Cell>

                {/* Actions */}
                <ModernTable.Cell className="text-center">
                  <ModernTable.RowActions />
                </ModernTable.Cell>
              </ModernTable.Row>
            ))}
          </ModernTable.Body>
        </ModernTable>

        {/* Table Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border-strong text-sm text-text-tertiary">
          <div>
            Showing {sortedData.length} of {sortedData.length} requests
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled>
              Previous
            </Button>
            <span className="px-2">Page 1 of 1</span>
            <Button size="sm" variant="outline" disabled>
              Next
            </Button>
          </div>
        </div>
      </ModernTable.Card.Root>
    </div>
  );
}