-- AlterEnum: Add SPECIAL leave type to LeaveType enum (Policy 6.19.c)
-- SPECIAL leave is for EL excess beyond 60 days, usable for medical or rest outside Bangladesh
-- Maximum 120 days SPECIAL (180 total - 60 EL)

ALTER TABLE `LeaveRequest` MODIFY `type` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE', 'SPECIAL') NOT NULL;

ALTER TABLE `Balance` MODIFY `type` ENUM('EARNED', 'CASUAL', 'MEDICAL', 'EXTRAWITHPAY', 'EXTRAWITHOUTPAY', 'MATERNITY', 'PATERNITY', 'STUDY', 'SPECIAL_DISABILITY', 'QUARANTINE', 'SPECIAL') NOT NULL;
