/*
  Warnings:

  - The `graded` column on the `assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "assignment_submissions" ADD COLUMN     "link" TEXT,
ADD COLUMN     "text" TEXT;

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "link" TEXT,
ALTER COLUMN "dueDate" DROP NOT NULL,
DROP COLUMN "graded",
ADD COLUMN     "graded" DOUBLE PRECISION NOT NULL DEFAULT 10;
