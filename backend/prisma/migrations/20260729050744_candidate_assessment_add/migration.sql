-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('SENT', 'STARTED', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "candidate_invitation" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'SENT',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempt" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "assessment_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "selected_questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_answer" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_result" (
    "id" UUID NOT NULL,
    "attempt_id" UUID NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "trait_scores" JSONB NOT NULL,
    "report" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_invitation_token_key" ON "candidate_invitation"("token");

-- CreateIndex
CREATE INDEX "candidate_invitation_candidate_id_idx" ON "candidate_invitation"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_invitation_status_idx" ON "candidate_invitation"("status");

-- CreateIndex
CREATE INDEX "exam_attempt_company_id_status_idx" ON "exam_attempt"("company_id", "status");

-- CreateIndex
CREATE INDEX "exam_attempt_candidate_id_idx" ON "exam_attempt"("candidate_id");

-- CreateIndex
CREATE INDEX "exam_attempt_assessment_id_idx" ON "exam_attempt"("assessment_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempt_candidate_id_assessment_id_key" ON "exam_attempt"("candidate_id", "assessment_id");

-- CreateIndex
CREATE INDEX "candidate_answer_attempt_id_idx" ON "candidate_answer"("attempt_id");

-- CreateIndex
CREATE INDEX "candidate_answer_attempt_id_category_idx" ON "candidate_answer"("attempt_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_answer_attempt_id_question_id_key" ON "candidate_answer"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_result_attempt_id_key" ON "assessment_result"("attempt_id");

-- AddForeignKey
ALTER TABLE "candidate_invitation" ADD CONSTRAINT "candidate_invitation_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempt" ADD CONSTRAINT "exam_attempt_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempt" ADD CONSTRAINT "exam_attempt_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempt" ADD CONSTRAINT "exam_attempt_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_answer" ADD CONSTRAINT "candidate_answer_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_result" ADD CONSTRAINT "assessment_result_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
