-- CreateEnum
CREATE TYPE "TaskGrade" AS ENUM ('PENDING', 'Q10', 'Q9', 'Q8', 'Q7', 'Q6', 'Q5', 'Q4', 'Q3', 'Q2', 'Q1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7');

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grade" "TaskGrade" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_id_key" ON "task"("id");
