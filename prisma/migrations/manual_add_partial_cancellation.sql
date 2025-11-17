-- Manual Migration: Add Partial Cancellation Approval Flow Fields
-- Date: 2025-11-17
-- Description: Adds fields to support partial cancellation approval workflow

-- Add new columns to LeaveRequest table
ALTER TABLE `LeaveRequest`
ADD COLUMN `isCancellationRequest` BOOLEAN NOT NULL DEFAULT false COMMENT 'True if this is a cancellation request (partial or full)',
ADD COLUMN `isPartialCancellation` BOOLEAN NOT NULL DEFAULT false COMMENT 'True if this is a partial cancellation request',
ADD COLUMN `originalEndDate` DATETIME NULL COMMENT 'For partial cancellation: stores the original end date before cancellation',
ADD COLUMN `cancellationReason` VARCHAR(500) NULL COMMENT 'Reason for cancellation request';

-- Add indexes for better query performance
CREATE INDEX `idx_leave_cancellation` ON `LeaveRequest` (`isCancellationRequest`, `status`);

-- Note: The approval flow has been updated to:
-- Regular Employees: Employee → HR_ADMIN → HR_HEAD → DEPT_HEAD
-- Department Heads: DEPT_HEAD → HR_ADMIN → HR_HEAD → CEO
-- This change is in the application code (lib/workflow.ts) and doesn't require database changes
