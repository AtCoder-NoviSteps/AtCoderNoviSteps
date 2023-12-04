/*
  Warnings:

  - You are about to drop the column `is_active` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `tag` table. All the data in the column will be lost.
  - The primary key for the `tasktag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[name]` on the table `tag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `is_official` to the `tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `tasktag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `tasktag` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tag_title_key";

-- DropIndex
DROP INDEX "tasktag_tag_id_key";

-- DropIndex
DROP INDEX "tasktag_task_id_key";

-- AlterTable
ALTER TABLE "tag" DROP COLUMN "is_active",
DROP COLUMN "title",
ADD COLUMN     "is_official" BOOLEAN NOT NULL,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "priority" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "tasktag" DROP CONSTRAINT "tasktag_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "priority" INTEGER NOT NULL,
ADD CONSTRAINT "tasktag_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "_TaskToTaskTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TagToTaskTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TaskToTaskTag_AB_unique" ON "_TaskToTaskTag"("A", "B");

-- CreateIndex
CREATE INDEX "_TaskToTaskTag_B_index" ON "_TaskToTaskTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTaskTag_AB_unique" ON "_TagToTaskTag"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToTaskTag_B_index" ON "_TagToTaskTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- AddForeignKey
ALTER TABLE "_TaskToTaskTag" ADD CONSTRAINT "_TaskToTaskTag_A_fkey" FOREIGN KEY ("A") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskToTaskTag" ADD CONSTRAINT "_TaskToTaskTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tasktag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTaskTag" ADD CONSTRAINT "_TagToTaskTag_A_fkey" FOREIGN KEY ("A") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTaskTag" ADD CONSTRAINT "_TagToTaskTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tasktag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
