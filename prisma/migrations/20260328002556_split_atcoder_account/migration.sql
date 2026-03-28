-- CreateTable: must be created before data migration and column drop
CREATE TABLE "atcoder_account" (
    "userId" TEXT NOT NULL,
    "handle" TEXT NOT NULL DEFAULT '',
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "validationCode" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atcoder_account_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "atcoder_account" ADD CONSTRAINT "atcoder_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: copy AtCoder fields from user to atcoder_account (only for users with a registered handle)
INSERT INTO "atcoder_account" ("userId", "handle", "isValidated", "validationCode", "createdAt", "updatedAt")
SELECT
    "id",
    "atcoder_username",
    COALESCE("atcoder_validation_status", false),
    "atcoder_validation_code",
    NOW(),
    NOW()
FROM "user"
WHERE "atcoder_username" != '';

-- AlterTable: drop AtCoder columns after data has been migrated
ALTER TABLE "user" DROP COLUMN "atcoder_username",
DROP COLUMN "atcoder_validation_code",
DROP COLUMN "atcoder_validation_status";
