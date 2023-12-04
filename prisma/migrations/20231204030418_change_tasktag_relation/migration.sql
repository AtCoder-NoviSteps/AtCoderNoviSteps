-- DropForeignKey
ALTER TABLE "task_tag" DROP CONSTRAINT "task_tag_task_id_fkey";

-- AddForeignKey
ALTER TABLE "task_tag" ADD CONSTRAINT "task_tag_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;
