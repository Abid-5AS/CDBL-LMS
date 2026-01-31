-- CreateIndex
CREATE INDEX `Approval_leaveId_step_idx` ON `Approval`(`leaveId`, `step`);

-- CreateIndex
CREATE INDEX `Approval_approverId_decision_decidedAt_idx` ON `Approval`(`approverId`, `decision`, `decidedAt`);

-- CreateIndex
CREATE INDEX `LeaveRequest_requesterId_status_createdAt_idx` ON `LeaveRequest`(`requesterId`, `status`, `createdAt`);

-- CreateIndex
CREATE INDEX `LeaveRequest_status_createdAt_idx` ON `LeaveRequest`(`status`, `createdAt`);

-- CreateIndex
CREATE INDEX `LeaveRequest_type_status_idx` ON `LeaveRequest`(`type`, `status`);

-- CreateIndex
CREATE INDEX `Notification_userId_read_createdAt_idx` ON `Notification`(`userId`, `read`, `createdAt`);
