/*
  Warnings:

  - You are about to drop the column `username` on the `submissionstatus` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[status_name,user_id]` on the table `submissionstatus` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `status_name` to the `submissionstatus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "submissionstatus" DROP COLUMN "username",
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "status_name" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "submissionstatus_status_name_user_id_key" ON "submissionstatus"("status_name", "user_id");
