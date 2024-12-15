/*
  Warnings:

  - The values [VANG_CO_PHEP,VANG_KHONG_PHEP] on the enum `PresenceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PresenceStatus_new" AS ENUM ('CO_MAT', 'VANG_MAT');
ALTER TABLE "attendance_status" ALTER COLUMN "status" TYPE "PresenceStatus_new" USING ("status"::text::"PresenceStatus_new");
ALTER TYPE "PresenceStatus" RENAME TO "PresenceStatus_old";
ALTER TYPE "PresenceStatus_new" RENAME TO "PresenceStatus";
DROP TYPE "PresenceStatus_old";
COMMIT;
