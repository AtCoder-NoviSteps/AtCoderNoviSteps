/*
  Warnings:

  - A unique constraint covering the columns `[urlSlug]` on the table `workbook` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "workbook" ADD COLUMN     "urlSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workbook_urlSlug_key" ON "workbook"("urlSlug");
