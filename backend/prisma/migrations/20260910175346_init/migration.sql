-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MINISTRY', 'DISTRICT', 'MP');

-- CreateEnum
CREATE TYPE "WorkLifecycleStatus" AS ENUM ('RECOMMENDED', 'SANCTIONED', 'IN_PROGRESS', 'COMPLETED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RiskTier" AS ENUM ('TIER_2', 'TIER_1', 'CLEAN');

-- CreateEnum
CREATE TYPE "RiskSignalType" AS ENUM ('COST_ANOMALY', 'DUPLICATE_OVERLAP', 'CROSS_STAGE_CONSISTENCY');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "State" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Constituency" (
    "id" SERIAL NOT NULL,
    "esakshiId" INTEGER,
    "name" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Constituency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MP" (
    "id" SERIAL NOT NULL,
    "esakshiId" INTEGER,
    "name" TEXT NOT NULL,
    "constituencyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImplementingAgency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImplementingAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "esakshiId" INTEGER,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "mpId" INTEGER,
    "districtId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" SERIAL NOT NULL,
    "recommendationDtlId" BIGINT NOT NULL,
    "workId" BIGINT,
    "activityName" TEXT,
    "category" TEXT,
    "description" TEXT,
    "stateId" INTEGER,
    "districtId" INTEGER,
    "constituencyId" INTEGER,
    "mpId" INTEGER,
    "implementingAgencyId" INTEGER,
    "stateNameFromSource" TEXT,
    "constituencyNameFromSource" TEXT,
    "mpNameFromSource" TEXT,
    "idaNameFromSource" TEXT,
    "lifecycleStatus" "WorkLifecycleStatus" NOT NULL DEFAULT 'UNKNOWN',
    "recommendationDate" TIMESTAMP(3),
    "sanctionDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "recommendedAmount" DECIMAL(18,2),
    "sanctionAmount" DECIMAL(18,2),
    "actualAmount" DECIMAL(18,2),
    "letterNo" TEXT,
    "flag" INTEGER,
    "averageRating" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expenditure" (
    "id" SERIAL NOT NULL,
    "workId" INTEGER NOT NULL,
    "vendorId" INTEGER,
    "implementingAgencyId" INTEGER,
    "amount" DECIMAL(18,2),
    "expenditureDate" TIMESTAMP(3),
    "workStatus" TEXT,
    "workRecommendationDtlId" BIGINT,
    "activityName" TEXT,
    "vendorNameFromSource" TEXT,
    "iaNameFromSource" TEXT,
    "constituencyFromSource" TEXT,
    "mpNameFromSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expenditure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "esakshiReviewId" BIGINT,
    "workId" INTEGER NOT NULL,
    "rating" INTEGER,
    "detail" TEXT,
    "workRecommendationDtlId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" SERIAL NOT NULL,
    "workId" INTEGER NOT NULL,
    "riskIndex" DECIMAL(5,2) NOT NULL,
    "tier" "RiskTier" NOT NULL,
    "primaryAnchors" JSONB,
    "explanation" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskSignal" (
    "id" SERIAL NOT NULL,
    "workId" INTEGER NOT NULL,
    "type" "RiskSignalType" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "score" DECIMAL(5,2),
    "reason" TEXT,
    "evidence" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateCandidate" (
    "id" SERIAL NOT NULL,
    "workAId" INTEGER NOT NULL,
    "workBId" INTEGER NOT NULL,
    "textSimilarity" DECIMAL(6,5),
    "amountRatio" DECIMAL(10,5),
    "daysApart" INTEGER,
    "sameVendor" BOOLEAN,
    "suspicionScore" DECIMAL(5,2),
    "humanReviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuplicateCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "reportName" TEXT NOT NULL,
    "scope" TEXT,
    "status" "IngestionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "recordsReceived" INTEGER NOT NULL DEFAULT 0,
    "recordsInserted" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawRecord" (
    "id" SERIAL NOT NULL,
    "ingestionRunId" INTEGER NOT NULL,
    "workId" INTEGER,
    "source" TEXT NOT NULL,
    "reportName" TEXT NOT NULL,
    "sourceRecordId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE INDEX "State_name_idx" ON "State"("name");

-- CreateIndex
CREATE INDEX "District_stateId_idx" ON "District"("stateId");

-- CreateIndex
CREATE INDEX "District_name_idx" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_stateId_name_key" ON "District"("stateId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Constituency_esakshiId_key" ON "Constituency"("esakshiId");

-- CreateIndex
CREATE INDEX "Constituency_stateId_idx" ON "Constituency"("stateId");

-- CreateIndex
CREATE INDEX "Constituency_name_idx" ON "Constituency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MP_esakshiId_key" ON "MP"("esakshiId");

-- CreateIndex
CREATE INDEX "MP_name_idx" ON "MP"("name");

-- CreateIndex
CREATE INDEX "MP_constituencyId_idx" ON "MP"("constituencyId");

-- CreateIndex
CREATE UNIQUE INDEX "ImplementingAgency_name_key" ON "ImplementingAgency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_esakshiId_key" ON "Vendor"("esakshiId");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_mpId_idx" ON "User"("mpId");

-- CreateIndex
CREATE INDEX "User_districtId_idx" ON "User"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "Work_recommendationDtlId_key" ON "Work"("recommendationDtlId");

-- CreateIndex
CREATE UNIQUE INDEX "Work_workId_key" ON "Work"("workId");

-- CreateIndex
CREATE INDEX "Work_recommendationDtlId_idx" ON "Work"("recommendationDtlId");

-- CreateIndex
CREATE INDEX "Work_workId_idx" ON "Work"("workId");

-- CreateIndex
CREATE INDEX "Work_stateId_idx" ON "Work"("stateId");

-- CreateIndex
CREATE INDEX "Work_districtId_idx" ON "Work"("districtId");

-- CreateIndex
CREATE INDEX "Work_constituencyId_idx" ON "Work"("constituencyId");

-- CreateIndex
CREATE INDEX "Work_mpId_idx" ON "Work"("mpId");

-- CreateIndex
CREATE INDEX "Work_lifecycleStatus_idx" ON "Work"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "Work_sanctionDate_idx" ON "Work"("sanctionDate");

-- CreateIndex
CREATE INDEX "Work_completionDate_idx" ON "Work"("completionDate");

-- CreateIndex
CREATE INDEX "Expenditure_workId_idx" ON "Expenditure"("workId");

-- CreateIndex
CREATE INDEX "Expenditure_vendorId_idx" ON "Expenditure"("vendorId");

-- CreateIndex
CREATE INDEX "Expenditure_expenditureDate_idx" ON "Expenditure"("expenditureDate");

-- CreateIndex
CREATE INDEX "Expenditure_workRecommendationDtlId_idx" ON "Expenditure"("workRecommendationDtlId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_esakshiReviewId_key" ON "Review"("esakshiReviewId");

-- CreateIndex
CREATE INDEX "Review_workId_idx" ON "Review"("workId");

-- CreateIndex
CREATE INDEX "Review_workRecommendationDtlId_idx" ON "Review"("workRecommendationDtlId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskAssessment_workId_key" ON "RiskAssessment"("workId");

-- CreateIndex
CREATE INDEX "RiskAssessment_tier_idx" ON "RiskAssessment"("tier");

-- CreateIndex
CREATE INDEX "RiskAssessment_riskIndex_idx" ON "RiskAssessment"("riskIndex");

-- CreateIndex
CREATE INDEX "RiskAssessment_evaluatedAt_idx" ON "RiskAssessment"("evaluatedAt");

-- CreateIndex
CREATE INDEX "RiskSignal_workId_idx" ON "RiskSignal"("workId");

-- CreateIndex
CREATE INDEX "RiskSignal_type_idx" ON "RiskSignal"("type");

-- CreateIndex
CREATE INDEX "RiskSignal_severity_idx" ON "RiskSignal"("severity");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_workAId_idx" ON "DuplicateCandidate"("workAId");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_workBId_idx" ON "DuplicateCandidate"("workBId");

-- CreateIndex
CREATE INDEX "DuplicateCandidate_suspicionScore_idx" ON "DuplicateCandidate"("suspicionScore");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateCandidate_workAId_workBId_key" ON "DuplicateCandidate"("workAId", "workBId");

-- CreateIndex
CREATE INDEX "IngestionRun_source_idx" ON "IngestionRun"("source");

-- CreateIndex
CREATE INDEX "IngestionRun_reportName_idx" ON "IngestionRun"("reportName");

-- CreateIndex
CREATE INDEX "IngestionRun_status_idx" ON "IngestionRun"("status");

-- CreateIndex
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt");

-- CreateIndex
CREATE INDEX "RawRecord_ingestionRunId_idx" ON "RawRecord"("ingestionRunId");

-- CreateIndex
CREATE INDEX "RawRecord_workId_idx" ON "RawRecord"("workId");

-- CreateIndex
CREATE INDEX "RawRecord_source_idx" ON "RawRecord"("source");

-- CreateIndex
CREATE INDEX "RawRecord_reportName_idx" ON "RawRecord"("reportName");

-- CreateIndex
CREATE INDEX "RawRecord_sourceRecordId_idx" ON "RawRecord"("sourceRecordId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Constituency" ADD CONSTRAINT "Constituency_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MP" ADD CONSTRAINT "MP_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_mpId_fkey" FOREIGN KEY ("mpId") REFERENCES "MP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_mpId_fkey" FOREIGN KEY ("mpId") REFERENCES "MP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_implementingAgencyId_fkey" FOREIGN KEY ("implementingAgencyId") REFERENCES "ImplementingAgency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_implementingAgencyId_fkey" FOREIGN KEY ("implementingAgencyId") REFERENCES "ImplementingAgency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateCandidate" ADD CONSTRAINT "DuplicateCandidate_workAId_fkey" FOREIGN KEY ("workAId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateCandidate" ADD CONSTRAINT "DuplicateCandidate_workBId_fkey" FOREIGN KEY ("workBId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawRecord" ADD CONSTRAINT "RawRecord_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawRecord" ADD CONSTRAINT "RawRecord_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
