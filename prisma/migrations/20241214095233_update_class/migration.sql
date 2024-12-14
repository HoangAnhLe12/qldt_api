/*
  Warnings:

  - Added the required column `type` to the `classes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('LT', 'BT', 'TN', 'LT_BT');

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "type" TEXT NOT NULL;
