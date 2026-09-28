-- AlterTable: Agregar degree y experienceYears a DirectorProfile
ALTER TABLE "DirectorProfile" ADD COLUMN "degree" TEXT;
ALTER TABLE "DirectorProfile" ADD COLUMN "experienceYears" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Agregar experienceYears a TeacherProfile
ALTER TABLE "TeacherProfile" ADD COLUMN "experienceYears" INTEGER NOT NULL DEFAULT 0;
