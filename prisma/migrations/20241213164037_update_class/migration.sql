/*
  Warnings:

  - The `schedule` column on the `classes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "classes" DROP COLUMN "schedule",
ADD COLUMN     "schedule" TIMESTAMP(3)[],
ALTER COLUMN "open" SET DEFAULT false;
