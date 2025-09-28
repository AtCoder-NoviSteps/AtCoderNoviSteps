-- CreateTable
CREATE TABLE "public"."contesttaskpair" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "taskTableIndex" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contesttaskpair_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contesttaskpair_contestId_idx" ON "public"."contesttaskpair"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "contesttaskpair_contestId_taskId_key" ON "public"."contesttaskpair"("contestId", "taskId");
