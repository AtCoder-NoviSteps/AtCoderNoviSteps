/*
  Warnings:

  - The primary key for the `votegrade` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `votegrade` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "votegrade" DROP CONSTRAINT "votegrade_pkey",
ADD CONSTRAINT "votegrade_pkey" PRIMARY KEY ("userId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "votegrade_id_key" ON "votegrade"("id");
