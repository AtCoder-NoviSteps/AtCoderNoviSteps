-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ContestType" AS ENUM ('ABC', 'APG4B', 'ABS', 'ACL_PRACTICE', 'PAST', 'EDPC', 'TDPC', 'JOI', 'TYPICAL90', 'TESSOKU_BOOK', 'MATH_AND_ALGORITHM');

-- CreateEnum
CREATE TYPE "TaskGrade" AS ENUM ('PENDING', 'Q11', 'Q10', 'Q9', 'Q8', 'Q7', 'Q6', 'Q5', 'Q4', 'Q3', 'Q2', 'Q1', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6');

-- CreateEnum
CREATE TYPE "AtcoderProblemsDifficulty" AS ENUM ('PENDING', 'UNAVAILABLE', 'GRAY', 'BROWN', 'GREEN', 'CYAN', 'BLUE', 'YELLOW', 'ORANGE', 'RED', 'BRONZE', 'SILVER', 'GOLD');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "Roles" NOT NULL DEFAULT 'USER',
    "atcoder_validation_code" TEXT NOT NULL DEFAULT '',
    "atcoder_username" TEXT NOT NULL DEFAULT '',
    "atcoder_validation_status" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "active_expires" BIGINT NOT NULL,
    "idle_expires" BIGINT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key" (
    "id" TEXT NOT NULL,
    "hashed_password" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" TEXT NOT NULL,
    "contest_type" "ContestType" NOT NULL DEFAULT 'ABC',
    "contest_id" TEXT NOT NULL,
    "task_table_index" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "grade" "TaskGrade" NOT NULL DEFAULT 'PENDING',
    "atcoder_problems_difficulty" "AtcoderProblemsDifficulty" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "id" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_official" BOOLEAN NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

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
    "status_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taskanswer_pkey" PRIMARY KEY ("task_id","user_id")
);

-- CreateTable
CREATE TABLE "submissionstatus" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "status_name" TEXT NOT NULL,
    "is_AC" BOOLEAN NOT NULL DEFAULT false,
    "label_name" TEXT NOT NULL,
    "image_path" TEXT NOT NULL,
    "button_color" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "submissionstatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_id_key" ON "session"("id");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "key_id_key" ON "key"("id");

-- CreateIndex
CREATE INDEX "key_user_id_idx" ON "key"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_id_key" ON "task"("id");

-- CreateIndex
CREATE UNIQUE INDEX "task_task_id_key" ON "task"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_id_key" ON "tag"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "taskanswer_id_key" ON "taskanswer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "taskanswer_task_id_user_id_key" ON "taskanswer"("task_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "submissionstatus_id_key" ON "submissionstatus"("id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key" ADD CONSTRAINT "key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasktag" ADD CONSTRAINT "tasktag_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasktag" ADD CONSTRAINT "tasktag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taskanswer" ADD CONSTRAINT "taskanswer_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "submissionstatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

