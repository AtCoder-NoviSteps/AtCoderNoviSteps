-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContestType" ADD VALUE 'APG4B';
ALTER TYPE "ContestType" ADD VALUE 'ABS';
ALTER TYPE "ContestType" ADD VALUE 'ACL_PRACTICE';
ALTER TYPE "ContestType" ADD VALUE 'PAST';
