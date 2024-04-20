-- DropForeignKey
ALTER TABLE "workbooktask" DROP CONSTRAINT "workbooktask_workBookId_fkey";

-- AddForeignKey
ALTER TABLE "workbooktask" ADD CONSTRAINT "workbooktask_workBookId_fkey" FOREIGN KEY ("workBookId") REFERENCES "workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
