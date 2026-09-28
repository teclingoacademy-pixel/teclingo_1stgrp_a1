-- AlterTable: Agregar columnas del Google Sheet a User
ALTER TABLE "User" ADD COLUMN "sheetId" TEXT;
ALTER TABLE "User" ADD COLUMN "metodo" TEXT;
ALTER TABLE "User" ADD COLUMN "nikName" TEXT;
ALTER TABLE "User" ADD COLUMN "nivel" TEXT;
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
ALTER TABLE "User" ADD COLUMN "lastAccess" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex: Unique constraint para sheetId
CREATE UNIQUE INDEX "User_sheetId_key" ON "User"("sheetId");

-- AlterTable: Agregar WRITING al enum Skill
ALTER TYPE "Skill" ADD VALUE 'WRITING';
