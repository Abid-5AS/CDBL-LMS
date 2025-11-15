/**
 * Dashboard Components - Reusable UI Components
 *
 * This module exports 8 standardized, reusable components for use across
 * all role-based dashboards in the CDBL Leave Management System.
 *
 * @module app/components/dashboard
 */

// 1. MetricCard - Display key statistics
export {
  MetricCard,
  MetricCardSkeleton,
  MetricCardGrid,
  type MetricCardProps,
} from "./MetricCard";

// 2. ActionCenter - Pending tasks/actions widget
export {
  ActionCenter,
  ActionCenterSkeleton,
  type ActionCenterProps,
  type ActionItem,
} from "./ActionCenter";

// 3. RecentActivityTable - Standardized activity table
export {
  RecentActivityTable,
  RecentActivityTableSkeleton,
  type RecentActivityTableProps,
  type ActivityRow,
  type ColumnDefinition,
} from "./RecentActivityTable";

// 4. LeaveBreakdownChart - Visual leave distribution
export {
  LeaveBreakdownChart,
  LeaveBreakdownChartSkeleton,
  type LeaveBreakdownChartProps,
  type LeaveChartData,
} from "./LeaveBreakdownChart";

// 5. TeamCapacityHeatmap - Team availability visualization
export {
  TeamCapacityHeatmap,
  TeamCapacityHeatmapSkeleton,
  type TeamCapacityHeatmapProps,
  type TeamMemberData,
} from "./TeamCapacityHeatmap";

// 6. ApprovalList - Approval workflow list
export {
  ApprovalList,
  ApprovalListSkeleton,
  type ApprovalListProps,
  type ApprovalItem,
  type ApprovalStep,
} from "./ApprovalList";

// 7. DocumentUploader - Unified file upload
export {
  DocumentUploader,
  type DocumentUploaderProps,
  type DocumentType,
  type UploadStatus,
  type UploadedFile,
} from "./DocumentUploader";

// 8. LeaveTimeline - Leave history timeline
export {
  LeaveTimeline,
  LeaveTimelineSkeleton,
  type LeaveTimelineProps,
  type LeaveTimelineItem,
  type LeaveStatus,
  type TimelineApprovalStep,
} from "./LeaveTimeline";
