-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('EMPLOYEE', 'MANAGER', 'HR', 'CEO') NOT NULL DEFAULT 'EMPLOYEE',
    `department` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_empCode_key`(`empCode`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requesterId` INTEGER NOT NULL,
    `type` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `workingDays` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `needsCertificate` BOOLEAN NOT NULL DEFAULT false,
    `certificateUrl` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `policyVersion` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Approval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leaveId` INTEGER NOT NULL,
    `step` INTEGER NOT NULL,
    `approverId` INTEGER NOT NULL,
    `decision` VARCHAR(191) NOT NULL,
    `comment` VARCHAR(191) NULL,
    `decidedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Balance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE') NOT NULL,
    `year` INTEGER NOT NULL,
    `opening` INTEGER NOT NULL,
    `accrued` INTEGER NOT NULL,
    `used` INTEGER NOT NULL DEFAULT 0,
    `closing` INTEGER NOT NULL,

    UNIQUE INDEX `Balance_userId_type_year_key`(`userId`, `type`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Holiday` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isOptional` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Holiday_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_leaveId_fkey` FOREIGN KEY (`leaveId`) REFERENCES `LeaveRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_approverId_fkey` FOREIGN KEY (`approverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
