-- CreateTable
CREATE TABLE "votegrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "grade" "TaskGrade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votegrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votedgradecounter" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "grade" "TaskGrade" NOT NULL,
    "count" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votedgradecounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votedgradestatistics" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "grade" "TaskGrade" NOT NULL,
    "isExperimental" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votedgradestatistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "votegrade_userId_taskId_key" ON "votegrade"("userId", "taskId");

-- AddForeignKey
ALTER TABLE "votegrade" ADD CONSTRAINT "votegrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votegrade" ADD CONSTRAINT "votegrade_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;
