/*
  Warnings:

  - You are about to drop the column `requestTime` on the `leave_requests` table. All the data in the column will be lost.
  - Added the required column `date` to the `leave_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `leave_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "requestTime",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
