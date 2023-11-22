/*
  Warnings:

  - Added the required column `task_table_index` to the `task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "task" ADD COLUMN     "task_table_index" TEXT NOT NULL;
