-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipofffersId" TEXT NOT NULL,
    "trackingCode" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "destinationCountry" TEXT,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "lastTrackingSync" DATETIME,
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

-- CreateIndex
CREATE UNIQUE INDEX "Order_shipofffersId_key" ON "Order"("shipofffersId");
