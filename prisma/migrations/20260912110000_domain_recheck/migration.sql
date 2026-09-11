-- AlterTable
ALTER TABLE "Domain" ADD COLUMN     "failedChecks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
