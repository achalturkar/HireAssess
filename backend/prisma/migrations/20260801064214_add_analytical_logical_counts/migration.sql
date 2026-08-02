-- AlterTable
ALTER TABLE "assessment" ADD COLUMN     "analytical_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "logical_reasoning_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "competencyScores" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "developmentAreas" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "reportData" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_attemptId_key" ON "Report"("attemptId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "exam_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
