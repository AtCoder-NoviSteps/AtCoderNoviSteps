/*
  Warnings:

  - The values [D7] on the enum `TaskGrade` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TaskGrade_new" AS ENUM ('PENDING', 'Q11', 'Q10', 'Q9', 'Q8', 'Q7', 'Q6', 'Q5', 'Q4', 'Q3', 'Q2', 'Q1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6');
ALTER TABLE "task" ALTER COLUMN "grade" DROP DEFAULT;
ALTER TABLE "task" ALTER COLUMN "grade" TYPE "TaskGrade_new" USING ("grade"::text::"TaskGrade_new");
ALTER TYPE "TaskGrade" RENAME TO "TaskGrade_old";
ALTER TYPE "TaskGrade_new" RENAME TO "TaskGrade";
DROP TYPE "TaskGrade_old";
ALTER TABLE "task" ALTER COLUMN "grade" SET DEFAULT 'PENDING';
COMMIT;
