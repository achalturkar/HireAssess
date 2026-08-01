-- CreateEnum
CREATE TYPE "AssessmentLevel" AS ENUM ('ENTRY', 'MID', 'TOP');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('LIKERT', 'FORCED_CHOICE', 'SITUATIONAL_JUDGEMENT');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('INVITED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "candidate" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'INVITED',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" "AssessmentLevel" NOT NULL,
    "likert_count" INTEGER NOT NULL DEFAULT 0,
    "sjq_count" INTEGER NOT NULL DEFAULT 0,
    "forced_choice_count" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidate_company_id_status_idx" ON "candidate"("company_id", "status");

-- CreateIndex
CREATE INDEX "candidate_company_id_client_id_idx" ON "candidate"("company_id", "client_id");

-- CreateIndex
CREATE INDEX "candidate_company_id_assessment_id_idx" ON "candidate"("company_id", "assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_assessment_id_email_key" ON "candidate"("assessment_id", "email");

-- CreateIndex
CREATE INDEX "assessment_company_id_status_idx" ON "assessment"("company_id", "status");

-- CreateIndex
CREATE INDEX "assessment_company_id_client_id_idx" ON "assessment"("company_id", "client_id");

-- AddForeignKey
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate" ADD CONSTRAINT "candidate_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment" ADD CONSTRAINT "assessment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
