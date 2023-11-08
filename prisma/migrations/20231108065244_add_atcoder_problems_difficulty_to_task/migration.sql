-- CreateEnum
CREATE TYPE "AtcoderProblemsDifficulty" AS ENUM ('PENDING', 'UNAVAILABLE', 'GRAY', 'BROWN', 'GREEN', 'CYAN', 'BLUE', 'YELLOW', 'ORANGE', 'RED', 'BRONZE', 'SILVER', 'GOLD');

-- AlterTable
ALTER TABLE "task" ADD COLUMN     "atcoder_problems_difficulty" "AtcoderProblemsDifficulty" NOT NULL DEFAULT 'PENDING';
