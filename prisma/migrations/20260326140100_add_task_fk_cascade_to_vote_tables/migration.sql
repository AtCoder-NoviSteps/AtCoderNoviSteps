-- DropForeignKey
ALTER TABLE "votegrade" DROP CONSTRAINT "votegrade_taskId_fkey";

-- AddForeignKey
ALTER TABLE "votegrade" ADD CONSTRAINT "votegrade_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votedgradecounter" ADD CONSTRAINT "votedgradecounter_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votedgradestatistics" ADD CONSTRAINT "votedgradestatistics_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;
