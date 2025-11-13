-- AddColumn: retirementDate to User for study leave validation
ALTER TABLE `User` ADD COLUMN `retirementDate` DATETIME(3) NULL;
