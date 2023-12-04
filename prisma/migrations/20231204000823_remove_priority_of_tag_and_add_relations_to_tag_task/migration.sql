/*
  Warnings:

  - You are about to drop the column `priority` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the `_TagToTaskTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TaskToTaskTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tasktag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_TagToTaskTag" DROP CONSTRAINT "_TagToTaskTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_TagToTaskTag" DROP CONSTRAINT "_TagToTaskTag_B_fkey";

-- DropForeignKey
ALTER TABLE "_TaskToTaskTag" DROP CONSTRAINT "_TaskToTaskTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_TaskToTaskTag" DROP CONSTRAINT "_TaskToTaskTag_B_fkey";

-- AlterTable
ALTER TABLE "tag" DROP COLUMN "priority";

-- DropTable
DROP TABLE "_TagToTaskTag";

-- DropTable
DROP TABLE "_TaskToTaskTag";

-- DropTable
DROP TABLE "tasktag";

-- CreateTable
CREATE TABLE "task_tag" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_tag_pkey" PRIMARY KEY ("task_id","tag_id")
);

-- AddForeignKey
ALTER TABLE "task_tag" ADD CONSTRAINT "task_tag_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_tag" ADD CONSTRAINT "task_tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
