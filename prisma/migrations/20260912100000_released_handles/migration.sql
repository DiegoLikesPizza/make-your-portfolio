-- CreateTable
CREATE TABLE "ReleasedHandle" (
    "subdomain" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleasedHandle_pkey" PRIMARY KEY ("subdomain")
);
