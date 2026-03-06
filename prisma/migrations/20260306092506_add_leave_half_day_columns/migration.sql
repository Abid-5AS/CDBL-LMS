-- AlterTable
ALTER TABLE `LeaveRequest` ADD COLUMN `halfDayPeriod` VARCHAR(191) NULL,
    ADD COLUMN `isHalfDay` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `WorkflowPolicy` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requesterRole` ENUM('EMPLOYEE', 'DEPT_HEAD', 'HR_ADMIN', 'HR_HEAD', 'CEO', 'SYSTEM_ADMIN') NOT NULL,
    `leaveType` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE', 'SPECIAL') NULL,
    `chain` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` INTEGER NULL,

    UNIQUE INDEX `WorkflowPolicy_requesterRole_key`(`requesterRole`),
    INDEX `WorkflowPolicy_updatedBy_fkey`(`updatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkflowPolicy` ADD CONSTRAINT `WorkflowPolicy_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
