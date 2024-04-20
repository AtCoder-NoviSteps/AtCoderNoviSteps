/*
  Warnings:

  - Added the required column `title` to the `workbook` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workbook" ADD COLUMN     "title" TEXT NOT NULL;
