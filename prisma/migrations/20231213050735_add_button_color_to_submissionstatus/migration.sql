/*
  Warnings:

  - Added the required column `button_color` to the `submissionstatus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "submissionstatus" ADD COLUMN     "button_color" TEXT NOT NULL;
