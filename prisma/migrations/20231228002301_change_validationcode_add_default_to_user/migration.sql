/*
  Warnings:

  - You are about to drop the column `atcoder_validation` on the `user` table. All the data in the column will be lost.
  - Made the column `atcoder_username` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "atcoder_validation",
ADD COLUMN     "atcoder_validation_code" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "atcoder_username" SET NOT NULL,
ALTER COLUMN "atcoder_username" SET DEFAULT '',
ALTER COLUMN "atcoder_validation_status" SET DEFAULT false;
