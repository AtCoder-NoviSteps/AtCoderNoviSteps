/*
  Warnings:

  - The primary key for the `votedgradecounter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `votedgradecounter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[taskId,grade]` on the table `votedgradecounter` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "votedgradecounter" DROP CONSTRAINT "votedgradecounter_pkey",
ADD CONSTRAINT "votedgradecounter_pkey" PRIMARY KEY ("taskId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "votedgradecounter_id_key" ON "votedgradecounter"("id");

-- CreateIndex
CREATE UNIQUE INDEX "votedgradecounter_taskId_grade_key" ON "votedgradecounter"("taskId", "grade");
