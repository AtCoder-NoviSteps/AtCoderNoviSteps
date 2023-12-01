-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasktag" (
    "task_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasktag_pkey" PRIMARY KEY ("task_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_id_key" ON "tag"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_title_key" ON "tag"("title");

-- CreateIndex
CREATE UNIQUE INDEX "tasktag_task_id_key" ON "tasktag"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "tasktag_tag_id_key" ON "tasktag"("tag_id");
