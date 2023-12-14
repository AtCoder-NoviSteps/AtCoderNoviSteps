/*
  Warnings:

  - A unique constraint covering the columns `[task_id,user_id]` on the table `taskanswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "taskanswer_task_id_user_id_key" ON "taskanswer"("task_id", "user_id");
