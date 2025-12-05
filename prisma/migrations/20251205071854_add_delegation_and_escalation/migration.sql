/*
  Warnings:

  - You are about to alter the column `decision` on the `Approval` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - The values [OVERSTAY_PENDING] on the enum `LeaveRequest_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUPER_ADMIN] on the enum `EscalationRule_escalateToRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- DropIndex
DROP INDEX `User_joinDate_idx` ON `User`;

-- AlterTable
ALTER TABLE `Approval` ADD COLUMN `toRole` VARCHAR(191) NULL,
    MODIFY `decision` ENUM('APPROVED', 'REJECTED', 'FORWARDED', 'PENDING', 'RETURNED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `EncashmentRequest` ADD COLUMN `paymentDate` DATETIME(3) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `paymentReceiptUrl` VARCHAR(191) NULL,
    ADD COLUMN `paymentReference` VARCHAR(191) NULL,
    ADD COLUMN `paymentStatus` VARCHAR(191) NULL,
    ADD COLUMN `processedBy` INTEGER NULL;

-- AlterTable
ALTER TABLE `LeaveRequest` ADD COLUMN `cancellationReason` VARCHAR(191) NULL,
    ADD COLUMN `incidentDate` DATETIME(3) NULL,
    ADD COLUMN `isCancellationRequest` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPartialCancellation` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `originalEndDate` DATETIME(3) NULL,
    ADD COLUMN `payCalculation` JSON NULL,
    ADD COLUMN `studyLeaveDocuments` JSON NULL,
    MODIFY `status` ENUM('DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED', 'CANCELLATION_REQUESTED', 'RECALLED') NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE `PolicyConfig` MODIFY `leaveType` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE', 'SPECIAL') NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `deptHeadId` INTEGER NULL,
    MODIFY `role` ENUM('EMPLOYEE', 'DEPT_HEAD', 'HR_ADMIN', 'HR_HEAD', 'CEO', 'SYSTEM_ADMIN') NOT NULL DEFAULT 'EMPLOYEE';

-- CreateTable
CREATE TABLE `LeaveComment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaveId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `authorRole` VARCHAR(191) NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeaveComment_leaveId_idx`(`leaveId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaveId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` INTEGER NOT NULL,
    `createdByRole` VARCHAR(191) NOT NULL,

    INDEX `LeaveVersion_leaveId_idx`(`leaveId`),
    INDEX `LeaveVersion_leaveId_version_idx`(`leaveId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrgSettings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `description` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,

    UNIQUE INDEX `OrgSettings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('LEAVE_SUBMITTED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'LEAVE_RETURNED', 'LEAVE_FORWARDED', 'LEAVE_CANCELLED', 'LEAVE_CANCELLATION_REQUESTED', 'LEAVE_APPROACHING', 'APPROVAL_REQUIRED', 'ENCASHMENT_APPROVED', 'ENCASHMENT_REJECTED', 'SYSTEM_ANNOUNCEMENT', 'LEAVE_TYPE_CHANGED') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `leaveId` INTEGER NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `Notification_userId_read_idx`(`userId`, `read`),
    INDEX `Notification_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BalanceAdjustment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `leaveType` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE', 'SPECIAL') NOT NULL,
    `year` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `previousBalance` INTEGER NOT NULL,
    `newBalance` INTEGER NOT NULL,
    `adjustedBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BalanceAdjustment_userId_leaveType_year_idx`(`userId`, `leaveType`, `year`),
    INDEX `BalanceAdjustment_adjustedBy_idx`(`adjustedBy`),
    INDEX `BalanceAdjustment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalDelegation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delegatorId` INTEGER NOT NULL,
    `delegateId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `reason` VARCHAR(191) NULL,
    `leaveTypes` JSON NULL,
    `isPermanent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApprovalDelegation_delegatorId_isActive_idx`(`delegatorId`, `isActive`),
    INDEX `ApprovalDelegation_delegateId_isActive_idx`(`delegateId`, `isActive`),
    INDEX `ApprovalDelegation_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EscalationRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('EMPLOYEE', 'DEPT_HEAD', 'HR_ADMIN', 'HR_HEAD', 'CEO', 'SYSTEM_ADMIN') NOT NULL,
    `timeoutHours` INTEGER NOT NULL,
    `escalateToRole` ENUM('EMPLOYEE', 'DEPT_HEAD', 'HR_ADMIN', 'HR_HEAD', 'CEO', 'SYSTEM_ADMIN') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EscalationRule_role_escalateToRole_key`(`role`, `escalateToRole`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPreferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `dashboardLayout` JSON NULL,
    `theme` VARCHAR(191) NULL DEFAULT 'system',
    `notifications` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserPreferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HRISSync` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `recordsTotal` INTEGER NOT NULL,
    `recordsSynced` INTEGER NOT NULL DEFAULT 0,
    `recordsFailed` INTEGER NOT NULL DEFAULT 0,
    `errors` JSON NULL,
    `createdBy` INTEGER NOT NULL,

    INDEX `HRISSync_status_startedAt_idx`(`status`, `startedAt`),
    INDEX `HRISSync_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HRISConflict` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `syncId` INTEGER NOT NULL,
    `employeeId` INTEGER NULL,
    `conflictType` VARCHAR(191) NOT NULL,
    `hrisData` JSON NOT NULL,
    `systemData` JSON NOT NULL,
    `resolution` VARCHAR(191) NULL,
    `resolvedBy` INTEGER NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HRISConflict_syncId_resolution_idx`(`syncId`, `resolution`),
    INDEX `HRISConflict_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `leaveType` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE', 'SPECIAL') NOT NULL,
    `duration` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `isShared` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaveTemplate_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PolicyVersion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `version` VARCHAR(191) NOT NULL,
    `changes` JSON NOT NULL,
    `changedBy` INTEGER NOT NULL,
    `effectiveFrom` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PolicyVersion_effectiveFrom_idx`(`effectiveFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `permanentAddress` TEXT NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `bloodGroup` VARCHAR(191) NULL,
    `maritalStatus` VARCHAR(191) NULL,
    `nid` VARCHAR(191) NULL,
    `tin` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmergencyContact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `relation` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmergencyContact_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BankDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `branchName` VARCHAR(191) NULL,
    `routingNumber` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BankDetails_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserDocument_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduledReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `reportType` ENUM('LEAVE_SUMMARY', 'LEAVE_BALANCE', 'LEAVE_UTILIZATION', 'ATTENDANCE_REPORT', 'APPROVAL_TIMES', 'DEPARTMENT_ANALYTICS', 'EMPLOYEE_HISTORY', 'BURNOUT_RISK', 'COST_ANALYSIS', 'PATTERN_DETECTION', 'FORECAST_REPORT', 'COMPLIANCE_AUDIT') NOT NULL,
    `format` ENUM('PDF', 'EXCEL', 'CSV', 'JSON') NOT NULL,
    `frequency` ENUM('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM') NOT NULL,
    `recipients` JSON NOT NULL,
    `filters` JSON NULL,
    `scheduleTime` VARCHAR(191) NULL,
    `scheduleDay` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastRunAt` DATETIME(3) NULL,
    `nextRunAt` DATETIME(3) NULL,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScheduledReport_createdBy_idx`(`createdBy`),
    INDEX `ScheduledReport_isActive_nextRunAt_idx`(`isActive`, `nextRunAt`),
    INDEX `ScheduledReport_reportType_isActive_idx`(`reportType`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportExecution` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `recordCount` INTEGER NULL,
    `errorLog` TEXT NULL,
    `sentTo` JSON NULL,

    INDEX `ReportExecution_reportId_status_idx`(`reportId`, `status`),
    INDEX `ReportExecution_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CalendarConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `provider` ENUM('GOOGLE', 'OUTLOOK') NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NOT NULL,
    `refreshToken` TEXT NOT NULL,
    `tokenExpiry` DATETIME(3) NOT NULL,
    `calendarId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncAt` DATETIME(3) NULL,
    `syncErrors` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CalendarConfig_userId_isActive_idx`(`userId`, `isActive`),
    INDEX `CalendarConfig_provider_idx`(`provider`),
    UNIQUE INDEX `CalendarConfig_userId_provider_key`(`userId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveCalendarMapping` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaveId` INTEGER NOT NULL,
    `calendarConfigId` INTEGER NOT NULL,
    `externalEventId` VARCHAR(191) NOT NULL,
    `lastSyncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `syncStatus` VARCHAR(191) NOT NULL DEFAULT 'synced',
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaveCalendarMapping_leaveId_idx`(`leaveId`),
    INDEX `LeaveCalendarMapping_calendarConfigId_idx`(`calendarConfigId`),
    INDEX `LeaveCalendarMapping_syncStatus_idx`(`syncStatus`),
    UNIQUE INDEX `LeaveCalendarMapping_leaveId_calendarConfigId_key`(`leaveId`, `calendarConfigId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Webhook` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `events` JSON NOT NULL,
    `secret` TEXT NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `headers` JSON NULL,
    `lastTriggeredAt` DATETIME(3) NULL,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `lastFailureAt` DATETIME(3) NULL,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Webhook_enabled_idx`(`enabled`),
    INDEX `Webhook_createdBy_idx`(`createdBy`),
    INDEX `Webhook_lastTriggeredAt_idx`(`lastTriggeredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookDelivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `webhookId` INTEGER NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `requestUrl` TEXT NOT NULL,
    `requestHeaders` JSON NULL,
    `requestBody` JSON NOT NULL,
    `responseStatus` INTEGER NULL,
    `responseHeaders` JSON NULL,
    `responseBody` TEXT NULL,
    `status` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `errorMessage` TEXT NULL,
    `errorCode` VARCHAR(191) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `nextRetryAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WebhookDelivery_webhookId_idx`(`webhookId`),
    INDEX `WebhookDelivery_event_idx`(`event`),
    INDEX `WebhookDelivery_status_idx`(`status`),
    INDEX `WebhookDelivery_createdAt_idx`(`createdAt`),
    INDEX `WebhookDelivery_nextRetryAt_idx`(`nextRetryAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Approval_approverId_decision_idx` ON `Approval`(`approverId`, `decision`);

-- CreateIndex
CREATE INDEX `Approval_approverId_decidedAt_idx` ON `Approval`(`approverId`, `decidedAt`);

-- CreateIndex
CREATE INDEX `EncashmentRequest_paymentStatus_idx` ON `EncashmentRequest`(`paymentStatus`);

-- CreateIndex
CREATE INDEX `LeaveRequest_requesterId_status_idx` ON `LeaveRequest`(`requesterId`, `status`);

-- CreateIndex
CREATE INDEX `LeaveRequest_status_startDate_idx` ON `LeaveRequest`(`status`, `startDate`);

-- CreateIndex
CREATE INDEX `LeaveRequest_status_updatedAt_idx` ON `LeaveRequest`(`status`, `updatedAt`);

-- CreateIndex
CREATE INDEX `LeaveRequest_startDate_endDate_status_idx` ON `LeaveRequest`(`startDate`, `endDate`, `status`);

-- CreateIndex
CREATE INDEX `LeaveRequest_type_status_startDate_idx` ON `LeaveRequest`(`type`, `status`, `startDate`);

-- CreateIndex
CREATE INDEX `User_deptHeadId_idx` ON `User`(`deptHeadId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_deptHeadId_fkey` FOREIGN KEY (`deptHeadId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveComment` ADD CONSTRAINT `LeaveComment_leaveId_fkey` FOREIGN KEY (`leaveId`) REFERENCES `LeaveRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveVersion` ADD CONSTRAINT `LeaveVersion_leaveId_fkey` FOREIGN KEY (`leaveId`) REFERENCES `LeaveRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EncashmentRequest` ADD CONSTRAINT `EncashmentRequest_processedBy_fkey` FOREIGN KEY (`processedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BalanceAdjustment` ADD CONSTRAINT `BalanceAdjustment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BalanceAdjustment` ADD CONSTRAINT `BalanceAdjustment_adjustedBy_fkey` FOREIGN KEY (`adjustedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalDelegation` ADD CONSTRAINT `ApprovalDelegation_delegatorId_fkey` FOREIGN KEY (`delegatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalDelegation` ADD CONSTRAINT `ApprovalDelegation_delegateId_fkey` FOREIGN KEY (`delegateId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPreferences` ADD CONSTRAINT `UserPreferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRISSync` ADD CONSTRAINT `HRISSync_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRISConflict` ADD CONSTRAINT `HRISConflict_syncId_fkey` FOREIGN KEY (`syncId`) REFERENCES `HRISSync`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRISConflict` ADD CONSTRAINT `HRISConflict_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HRISConflict` ADD CONSTRAINT `HRISConflict_resolvedBy_fkey` FOREIGN KEY (`resolvedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveTemplate` ADD CONSTRAINT `LeaveTemplate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PolicyVersion` ADD CONSTRAINT `PolicyVersion_changedBy_fkey` FOREIGN KEY (`changedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmergencyContact` ADD CONSTRAINT `EmergencyContact_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BankDetails` ADD CONSTRAINT `BankDetails_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDocument` ADD CONSTRAINT `UserDocument_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledReport` ADD CONSTRAINT `ScheduledReport_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportExecution` ADD CONSTRAINT `ReportExecution_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `ScheduledReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CalendarConfig` ADD CONSTRAINT `CalendarConfig_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveCalendarMapping` ADD CONSTRAINT `LeaveCalendarMapping_leaveId_fkey` FOREIGN KEY (`leaveId`) REFERENCES `LeaveRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveCalendarMapping` ADD CONSTRAINT `LeaveCalendarMapping_calendarConfigId_fkey` FOREIGN KEY (`calendarConfigId`) REFERENCES `CalendarConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Webhook` ADD CONSTRAINT `Webhook_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookDelivery` ADD CONSTRAINT `WebhookDelivery_webhookId_fkey` FOREIGN KEY (`webhookId`) REFERENCES `Webhook`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Approval` RENAME INDEX `Approval_leaveId_fkey` TO `Approval_leaveId_idx`;
