-- CreateTable
CREATE TABLE "workbooktask" (
    "id" TEXT NOT NULL,
    "workBookId" INTEGER NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workbooktask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workbooktask_id_key" ON "workbooktask"("id");

-- AddForeignKey
ALTER TABLE "workbooktask" ADD CONSTRAINT "workbooktask_workBookId_fkey" FOREIGN KEY ("workBookId") REFERENCES "workbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workbooktask" ADD CONSTRAINT "workbooktask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
