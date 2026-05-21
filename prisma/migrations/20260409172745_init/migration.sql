-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipofffersId" TEXT NOT NULL,
    "trackingCode" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "destinationCountry" TEXT,
    "orderedAt" DATETIME,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "lastTrackingSync" DATETIME,
    "daysSinceOrder" INTEGER,
    "daysInTransit" INTEGER,
    "delayThreshold" INTEGER,
    "isDelayed" BOOLEAN NOT NULL DEFAULT false,
    "alertSentAt" DATETIME,
    "rawTrackingData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DelayThreshold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_shipofffersId_key" ON "Order"("shipofffersId");

-- CreateIndex
CREATE UNIQUE INDEX "DelayThreshold_countryCode_key" ON "DelayThreshold"("countryCode");
