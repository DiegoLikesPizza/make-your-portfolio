-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "previewToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Site_previewToken_key" ON "Site"("previewToken");
