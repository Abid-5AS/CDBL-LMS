-- Add isModified column to LeaveRequest table
ALTER TABLE `LeaveRequest` ADD COLUMN `isModified` BOOLEAN NOT NULL DEFAULT false;
