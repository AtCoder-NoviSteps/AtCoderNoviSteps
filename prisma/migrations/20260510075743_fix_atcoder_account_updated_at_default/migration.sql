-- @updatedAt is managed by Prisma ORM, not the DB layer. The original
-- split_atcoder_account migration incorrectly added DEFAULT CURRENT_TIMESTAMP
-- to updatedAt. This migration aligns the migration history with the actual DB state.
ALTER TABLE "atcoder_account" ALTER COLUMN "updatedAt" DROP DEFAULT;
