-- CreateEnum
CREATE TYPE "WorkBookType" AS ENUM ('CREATED_BY_USER', 'TEXTBOOK', 'SOLUTION', 'THEME');

-- CreateTable
CREATE TABLE "workbook" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "workBookType" "WorkBookType" NOT NULL DEFAULT 'CREATED_BY_USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workbook_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "workbook" ADD CONSTRAINT "workbook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
