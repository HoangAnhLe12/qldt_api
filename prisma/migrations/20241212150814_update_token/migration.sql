/*
  Warnings:

  - Made the column `token` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `avatar` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "token" SET NOT NULL,
ALTER COLUMN "avatar" SET NOT NULL;
