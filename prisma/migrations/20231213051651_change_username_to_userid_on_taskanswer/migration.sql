/*
  Warnings:

  - The primary key for the `taskanswer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `username` on the `taskanswer` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `taskanswer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "taskanswer" DROP CONSTRAINT "taskanswer_username_fkey";

-- AlterTable
ALTER TABLE "taskanswer" DROP CONSTRAINT "taskanswer_pkey",
DROP COLUMN "username",
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "taskanswer_pkey" PRIMARY KEY ("task_id", "user_id");

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
