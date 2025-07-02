-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plaidAccessToken" TEXT,
ADD COLUMN     "plaidItemId" TEXT;
