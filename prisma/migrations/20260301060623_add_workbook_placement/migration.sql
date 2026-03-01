-- CreateEnum
CREATE TYPE "SolutionCategory" AS ENUM ('PENDING', 'SEARCH_SIMULATION', 'DYNAMIC_PROGRAMMING', 'DATA_STRUCTURE', 'GRAPH', 'TREE', 'NUMBER_THEORY', 'ALGEBRA', 'COMBINATORICS', 'GAME', 'STRING', 'GEOMETRY', 'OPTIMIZATION', 'OTHERS', 'ANALYSIS');

-- CreateTable
CREATE TABLE "workbookplacement" (
    "id" SERIAL NOT NULL,
    "workBookId" INTEGER NOT NULL,
    "taskGrade" "TaskGrade",
    "solutionCategory" "SolutionCategory",
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workbookplacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workbookplacement_workBookId_key" ON "workbookplacement"("workBookId");

-- AddForeignKey
ALTER TABLE "workbookplacement" ADD CONSTRAINT "workbookplacement_workBookId_fkey" FOREIGN KEY ("workBookId") REFERENCES "workbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint (XOR: taskGrade と solutionCategory はどちらか片方のみ non-null)
ALTER TABLE "workbookplacement"
ADD CONSTRAINT "workbookplacement_xor_grade_category"
CHECK (
  ("taskGrade" IS NOT NULL AND "solutionCategory" IS NULL)
  OR ("taskGrade" IS NULL AND "solutionCategory" IS NOT NULL)
);
