/*
  Warnings:

  - You are about to drop the `VerificationCode` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `maxStudents` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semester` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeEnd` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeStart` to the `classes` table without a default value. This is not possible if the table is not empty.
  - Made the column `schedule` on table `classes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "VerificationCode" DROP CONSTRAINT "VerificationCode_userId_fkey";

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "maxStudents" INTEGER NOT NULL,
ADD COLUMN     "open" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "semester" TEXT NOT NULL,
ADD COLUMN     "timeEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "timeStart" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "schedule" SET NOT NULL;

-- DropTable
DROP TABLE "VerificationCode";

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
