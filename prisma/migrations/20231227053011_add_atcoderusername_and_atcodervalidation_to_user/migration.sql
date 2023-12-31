/*
  Warnings:

  - A unique constraint covering the columns `[status_name]` on the table `submissionstatus` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "submissionstatus_status_name_user_id_key";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "atcoder_username" TEXT,
ADD COLUMN     "atcoder_validation" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "submissionstatus_status_name_key" ON "submissionstatus"("status_name");
