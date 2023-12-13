/*
  Warnings:

  - The primary key for the `taskanswer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `taskanswer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `taskanswer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `taskanswer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "taskanswer" DROP CONSTRAINT "taskanswer_user_id_fkey";

-- AlterTable
ALTER TABLE "submissionstatus" ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "taskanswer" DROP CONSTRAINT "taskanswer_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "username" TEXT NOT NULL,
ADD CONSTRAINT "taskanswer_pkey" PRIMARY KEY ("task_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "taskanswer_id_key" ON "taskanswer"("id");

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_username_fkey" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE RESTRICT ON UPDATE CASCADE;
