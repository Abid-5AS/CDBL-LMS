-- AlterTable
ALTER TABLE `LeaveRequest` ADD COLUMN `parentLeaveId` INTEGER NULL,
    ADD COLUMN `isExtension` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `LeaveRequest_parentLeaveId_idx` ON `LeaveRequest`(`parentLeaveId`);

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_parentLeaveId_fkey` FOREIGN KEY (`parentLeaveId`) REFERENCES `LeaveRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
