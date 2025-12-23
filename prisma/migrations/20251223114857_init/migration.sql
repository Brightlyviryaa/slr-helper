-- CreateTable
CREATE TABLE "SlrProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SlrProtocol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "protocolTitle" TEXT NOT NULL,
    "background" TEXT,
    "objective" TEXT,
    "reviewQuestionFull" TEXT,
    "picoPopulation" TEXT,
    "picoIntervention" TEXT,
    "picoComparison" TEXT,
    "picoOutcome" TEXT,
    "searchStrategy" TEXT,
    "identifyingOtherSources" TEXT,
    "additionalLimits" TEXT,
    "studyQualityAssessmentPlan" TEXT,
    "dataExtractionAndSynthesis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SlrProtocol_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SlrProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProtocolDatabase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "ProtocolDatabase_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "SlrProtocol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProtocolSearchTerm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "queryString" TEXT NOT NULL,
    CONSTRAINT "ProtocolSearchTerm_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "SlrProtocol" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlrStudy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "paperKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "year" INTEGER NOT NULL,
    "venue" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "keywords" TEXT,
    "researchType" TEXT,
    "domain" TEXT,
    "problemStatement" TEXT,
    "proposedSolution" TEXT,
    "keyTechniques" TEXT,
    "dataInputUsed" TEXT,
    "outputArtifact" TEXT,
    "evaluationMethod" TEXT,
    "metricsResults" TEXT,
    "strengths" TEXT,
    "limitations" TEXT,
    "gapNotes" TEXT,
    "adoptionForThesis" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TO_READ',
    "exclusionReason" TEXT,
    "relevanceScore" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SlrStudy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SlrProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityCriterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" INTEGER,
    CONSTRAINT "QualityCriterion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SlrProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyQualityScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studyId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "StudyQualityScore_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "SlrStudy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudyQualityScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "QualityCriterion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "StudyTag" (
    "studyId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("studyId", "tagId"),
    CONSTRAINT "StudyTag_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "SlrStudy" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudyTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SlrProtocol_projectId_key" ON "SlrProtocol"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
