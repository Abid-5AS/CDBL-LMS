-- CreateIndex
CREATE INDEX `Balance_userId_year_idx` ON `Balance`(`userId`, `year`);

-- CreateIndex
CREATE INDEX `LeaveRequest_createdAt_idx` ON `LeaveRequest`(`createdAt`);
