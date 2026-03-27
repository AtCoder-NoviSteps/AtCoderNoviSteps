/*
  Warnings:

  - A unique constraint covering the columns `[taskId]` on the table `votedgradestatistics` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "votedgradecounter_taskId_grade_key";

-- DropIndex
DROP INDEX "votegrade_userId_taskId_key";

-- CreateIndex
CREATE UNIQUE INDEX "votedgradestatistics_taskId_key" ON "votedgradestatistics"("taskId");
