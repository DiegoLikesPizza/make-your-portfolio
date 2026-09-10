-- CreateTable
CREATE TABLE "SiteView" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteView_siteId_day_idx" ON "SiteView"("siteId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "SiteView_siteId_day_source_key" ON "SiteView"("siteId", "day", "source");

-- AddForeignKey
ALTER TABLE "SiteView" ADD CONSTRAINT "SiteView_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

