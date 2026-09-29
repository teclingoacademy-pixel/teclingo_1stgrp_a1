-- CreateTable
CREATE TABLE "LessonTheorySection" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonTheorySection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillTutorial" (
    "id" TEXT NOT NULL,
    "skill" "Skill" NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanationText" TEXT NOT NULL,
    "keyPoints" JSONB NOT NULL,
    "storageKey" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'es-MX',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0.92,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillTutorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarTopic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "mcer" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarExample" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "en" TEXT NOT NULL,
    "es" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "GrammarExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassKnowledgeMap" (
    "lessonId" TEXT NOT NULL,
    "grammarTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vocabTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassKnowledgeMap_pkey" PRIMARY KEY ("lessonId")
);

-- CreateTable
CREATE TABLE "MallaWeek" (
    "id" TEXT NOT NULL,
    "levelCode" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "phase" TEXT,
    "lessonIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isExamWeek" BOOLEAN NOT NULL DEFAULT false,
    "isClosingWeek" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "shortTitle" TEXT,
    "mcer" TEXT,
    "grammarFocus" TEXT,

    CONSTRAINT "MallaWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoursePhase" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weekFrom" INTEGER NOT NULL,
    "weekTo" INTEGER NOT NULL,
    "block" INTEGER NOT NULL,
    "mcer" TEXT NOT NULL,

    CONSTRAINT "CoursePhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramSemester" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "cefrTag" TEXT NOT NULL,

    CONSTRAINT "ProgramSemester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterSkill" (
    "id" TEXT NOT NULL,
    "semesterCode" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "accreditation" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "SemesterSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionModelText" (
    "id" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductionModelText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarBlock" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "mcer" TEXT NOT NULL,
    "structures" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "GrammarBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarStructure" (
    "id" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "block" INTEGER NOT NULL,
    "mcer" TEXT NOT NULL,
    "t1" BOOLEAN NOT NULL DEFAULT false,
    "t2" BOOLEAN NOT NULL DEFAULT false,
    "t3" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GrammarStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabBlock" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "words" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "VocabBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonContract" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "fragment" TEXT NOT NULL,
    "anchorPhrase" TEXT NOT NULL,
    "vocabBlock" INTEGER NOT NULL,
    "matrixRows" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "vocabExtra" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "LessonContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonCurriculum" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "classCode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "grammarFocus" TEXT NOT NULL,
    "vocabFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keyStructures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "suggestedPrompt" TEXT NOT NULL,

    CONSTRAINT "LessonCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonGrammarTip" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "commonMistake" TEXT,
    "examples" JSONB NOT NULL,

    CONSTRAINT "LessonGrammarTip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonQuickVocab" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "word" TEXT NOT NULL,
    "translation" TEXT NOT NULL,

    CONSTRAINT "LessonQuickVocab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MallaWeekLessons" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MallaWeekLessons_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "LessonTheorySection_lessonId_idx" ON "LessonTheorySection"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonTheorySection_lessonId_order_key" ON "LessonTheorySection"("lessonId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTutorial_skill_key" ON "SkillTutorial"("skill");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTutorial_storageKey_key" ON "SkillTutorial"("storageKey");

-- CreateIndex
CREATE INDEX "GrammarTopic_mcer_idx" ON "GrammarTopic"("mcer");

-- CreateIndex
CREATE INDEX "GrammarTopic_category_idx" ON "GrammarTopic"("category");

-- CreateIndex
CREATE INDEX "GrammarExample_topicId_idx" ON "GrammarExample"("topicId");

-- CreateIndex
CREATE INDEX "MallaWeek_levelCode_idx" ON "MallaWeek"("levelCode");

-- CreateIndex
CREATE UNIQUE INDEX "MallaWeek_levelCode_weekNumber_key" ON "MallaWeek"("levelCode", "weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CoursePhase_code_key" ON "CoursePhase"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramSemester_code_key" ON "ProgramSemester"("code");

-- CreateIndex
CREATE INDEX "SemesterSkill_semesterCode_idx" ON "SemesterSkill"("semesterCode");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterSkill_semesterCode_skill_key" ON "SemesterSkill"("semesterCode", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarBlock_number_key" ON "GrammarBlock"("number");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarStructure_structure_key" ON "GrammarStructure"("structure");

-- CreateIndex
CREATE INDEX "VocabBlock_source_idx" ON "VocabBlock"("source");

-- CreateIndex
CREATE UNIQUE INDEX "LessonContract_lessonId_key" ON "LessonContract"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonCurriculum_lessonId_key" ON "LessonCurriculum"("lessonId");

-- CreateIndex
CREATE INDEX "LessonCurriculum_lessonId_idx" ON "LessonCurriculum"("lessonId");

-- CreateIndex
CREATE INDEX "LessonGrammarTip_lessonId_idx" ON "LessonGrammarTip"("lessonId");

-- CreateIndex
CREATE INDEX "LessonQuickVocab_lessonId_idx" ON "LessonQuickVocab"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonQuickVocab_lessonId_order_key" ON "LessonQuickVocab"("lessonId", "order");

-- CreateIndex
CREATE INDEX "_MallaWeekLessons_B_index" ON "_MallaWeekLessons"("B");

-- AddForeignKey
ALTER TABLE "LessonTheorySection" ADD CONSTRAINT "LessonTheorySection_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarExample" ADD CONSTRAINT "GrammarExample_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GrammarTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassKnowledgeMap" ADD CONSTRAINT "ClassKnowledgeMap_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterSkill" ADD CONSTRAINT "SemesterSkill_semesterCode_fkey" FOREIGN KEY ("semesterCode") REFERENCES "ProgramSemester"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonContract" ADD CONSTRAINT "LessonContract_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonCurriculum" ADD CONSTRAINT "LessonCurriculum_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonGrammarTip" ADD CONSTRAINT "LessonGrammarTip_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonQuickVocab" ADD CONSTRAINT "LessonQuickVocab_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MallaWeekLessons" ADD CONSTRAINT "_MallaWeekLessons_A_fkey" FOREIGN KEY ("A") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MallaWeekLessons" ADD CONSTRAINT "_MallaWeekLessons_B_fkey" FOREIGN KEY ("B") REFERENCES "MallaWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

