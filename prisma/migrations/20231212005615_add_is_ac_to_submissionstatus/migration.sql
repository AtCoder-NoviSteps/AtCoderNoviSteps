/*
  Warnings:

  - Made the column `status_id` on table `taskanswer` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "taskanswer" DROP CONSTRAINT "taskanswer_status_id_fkey";

-- AlterTable
ALTER TABLE "submissionstatus" ADD COLUMN     "is_AC" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "taskanswer" ALTER COLUMN "status_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "submissionstatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
