-- DropForeignKey
ALTER TABLE "workbooktask" DROP CONSTRAINT "workbooktask_taskId_fkey";

-- AddForeignKey
ALTER TABLE "workbooktask" ADD CONSTRAINT "workbooktask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;
