-- AlterTable User: Add joinDate field for service eligibility calculations (Policy 6.18)
-- This field tracks employee service start date to validate leave type eligibility
-- Nullable to maintain backward compatibility with existing records

ALTER TABLE `User` ADD COLUMN `joinDate` DATETIME(3) NULL;

-- Create index on joinDate for efficient service year calculations
CREATE INDEX `User_joinDate_idx` ON `User`(`joinDate`);
