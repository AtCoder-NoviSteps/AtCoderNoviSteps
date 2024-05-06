/*
  Warnings:

  - Added the required column `priority` to the `workbooktask` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workbooktask" ADD COLUMN     "priority" INTEGER NOT NULL;
