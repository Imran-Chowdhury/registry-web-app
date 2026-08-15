-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'WITHHELD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'REVERSED');

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feeMinor" INTEGER NOT NULL,
    "feeDueDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "studentCode" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "programmeId" TEXT NOT NULL,
    "academicYear" INTEGER NOT NULL,
    "intakeYear" INTEGER NOT NULL,
    "status" "EnrolmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusChange" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromStatus" "EnrolmentStatus",
    "toStatus" "EnrolmentStatus" NOT NULL,
    "reason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "waivedMinor" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "reversalOf" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "maxAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "grade" INTEGER,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "withheldReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "markedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCodeCounter" (
    "year" INTEGER NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudentCodeCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "_ModuleToProgramme" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModuleToProgramme_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Programme_code_key" ON "Programme"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Module_code_key" ON "Module"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentCode_key" ON "Student"("studentCode");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE INDEX "Student_status_programmeId_idx" ON "Student"("status", "programmeId");

-- CreateIndex
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");

-- CreateIndex
CREATE INDEX "StatusChange_studentId_changedAt_idx" ON "StatusChange"("studentId", "changedAt");

-- CreateIndex
CREATE INDEX "FeeAssignment_studentId_dueDate_idx" ON "FeeAssignment"("studentId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_feeId_paidAt_idx" ON "Payment"("feeId", "paidAt");

-- CreateIndex
CREATE INDEX "Assessment_deadline_idx" ON "Assessment"("deadline");

-- CreateIndex
CREATE INDEX "Submission_assessmentId_submittedAt_idx" ON "Submission"("assessmentId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_studentId_assessmentId_attempt_key" ON "Submission"("studentId", "assessmentId", "attempt");

-- CreateIndex
CREATE INDEX "Result_assessmentId_status_idx" ON "Result"("assessmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Result_studentId_assessmentId_key" ON "Result"("studentId", "assessmentId");

-- CreateIndex
CREATE INDEX "_ModuleToProgramme_B_index" ON "_ModuleToProgramme"("B");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAssignment" ADD CONSTRAINT "FeeAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "FeeAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToProgramme" ADD CONSTRAINT "_ModuleToProgramme_A_fkey" FOREIGN KEY ("A") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToProgramme" ADD CONSTRAINT "_ModuleToProgramme_B_fkey" FOREIGN KEY ("B") REFERENCES "Programme"("id") ON DELETE CASCADE ON UPDATE CASCADE;
