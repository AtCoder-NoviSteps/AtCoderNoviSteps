-- CreateEnum
CREATE TYPE "ContestType" AS ENUM ('ABC', 'EDPC', 'TDPC', 'JOI', 'TYPICAL90', 'TESSOKU_BOOK', 'MATH_AND_ALGORITHM');

-- AlterTable
ALTER TABLE "task" ADD COLUMN     "contest_type" "ContestType" NOT NULL DEFAULT 'ABC';
