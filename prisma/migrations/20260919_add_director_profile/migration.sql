-- CreateTable
CREATE TABLE "DirectorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT,
    "curp" TEXT,
    "birthDate" TIMESTAMP(3),
    "institutionName" TEXT,
    "institutionLogo" TEXT,
    "slogan" TEXT,
    "instPhone" TEXT,
    "address" TEXT,
    "instEmail" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "institutionCode" TEXT,
    "institutionType" TEXT,
    "carrera1" TEXT,
    "carrera2" TEXT,
    "carrera3" TEXT,
    "carrera4" TEXT,
    "carrera5" TEXT,
    "carrera6" TEXT,
    "carrera7" TEXT,
    "turnoMatutino" BOOLEAN NOT NULL DEFAULT false,
    "turnoVespertino" BOOLEAN NOT NULL DEFAULT false,
    "turnoSemiEscolarizado" BOOLEAN NOT NULL DEFAULT false,
    "turnoSabatino" BOOLEAN NOT NULL DEFAULT false,
    "turnoDistancia" BOOLEAN NOT NULL DEFAULT false,
    "modalidad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DirectorProfile_userId_key" ON "DirectorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectorProfile_institutionCode_key" ON "DirectorProfile"("institutionCode");

-- AddForeignKey
ALTER TABLE "DirectorProfile" ADD CONSTRAINT "DirectorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
