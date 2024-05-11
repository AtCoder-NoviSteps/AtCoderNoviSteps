/*
  Warnings:

  - You are about to drop the column `userId` on the `workbook` table. All the data in the column will be lost.
  - Made the column `authorId` on table `workbook` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "workbook" DROP CONSTRAINT "workbook_userId_fkey";

-- AlterTable
ALTER TABLE "workbook" DROP COLUMN "userId",
ALTER COLUMN "authorId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "workbook" ADD CONSTRAINT "workbook_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
