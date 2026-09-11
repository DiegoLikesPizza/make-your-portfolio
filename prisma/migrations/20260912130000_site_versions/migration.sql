-- CreateTable
CREATE TABLE "SiteVersion" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "doc" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVersion_siteId_publishedAt_idx" ON "SiteVersion"("siteId", "publishedAt");

-- AddForeignKey
ALTER TABLE "SiteVersion" ADD CONSTRAINT "SiteVersion_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
