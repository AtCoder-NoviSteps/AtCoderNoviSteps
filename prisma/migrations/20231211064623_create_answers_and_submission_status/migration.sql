/*
  Warnings:

  - You are about to drop the `task_tag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "task_tag" DROP CONSTRAINT "task_tag_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "task_tag" DROP CONSTRAINT "task_tag_task_id_fkey";

-- DropTable
DROP TABLE "task_tag";

-- CreateTable
CREATE TABLE "tasktag" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasktag_pkey" PRIMARY KEY ("task_id","tag_id")
);

-- CreateTable
CREATE TABLE "taskanswer" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taskanswer_pkey" PRIMARY KEY ("task_id","user_id")
);

-- CreateTable
CREATE TABLE "submissionstatus" (
    "id" TEXT NOT NULL,
    "label_name" TEXT NOT NULL,
    "image_path" TEXT NOT NULL,

    CONSTRAINT "submissionstatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submissionstatus_id_key" ON "submissionstatus"("id");

-- AddForeignKey
ALTER TABLE "tasktag" ADD CONSTRAINT "tasktag_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasktag" ADD CONSTRAINT "tasktag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "submissionstatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
