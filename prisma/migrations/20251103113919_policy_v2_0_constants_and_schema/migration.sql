-- AlterTable: Add new LeaveStatus enum values
ALTER TABLE `LeaveRequest` MODIFY `status` ENUM('DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED', 'CANCELLATION_REQUESTED', 'RECALLED', 'OVERSTAY_PENDING') NOT NULL DEFAULT 'DRAFT';

-- AlterTable: Add fitnessCertificateUrl column to LeaveRequest
ALTER TABLE `LeaveRequest` ADD COLUMN `fitnessCertificateUrl` VARCHAR(191) NULL;

