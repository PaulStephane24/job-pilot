-- =============================================
-- JobPilot MVP - Database Migration
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "JobPlatform" AS ENUM ('LINKEDIN', 'INDEED', 'GLASSDOOR', 'COMPANY_WEBSITE', 'REFERRAL', 'PASTED', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- USERS
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- PROFILES
CREATE TABLE IF NOT EXISTS "profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "firstName" TEXT,
  "lastName" TEXT,
  "phone" TEXT,
  "location" TEXT,
  "bio" TEXT,
  "headline" TEXT,
  "website" TEXT,
  "linkedinUrl" TEXT,
  "githubUrl" TEXT,
  "twitterUrl" TEXT,
  "avatarUrl" TEXT,
  "resumeUrl" TEXT,
  "completionScore" INT NOT NULL DEFAULT 0,
  "isComplete" BOOLEAN NOT NULL DEFAULT FALSE,
  "languages" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- RESUMES
CREATE TABLE IF NOT EXISTS "resumes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "parsedData" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- SKILLS
CREATE TABLE IF NOT EXISTS "skills" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "level" INT,
  "category" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- EXPERIENCES
CREATE TABLE IF NOT EXISTS "experiences" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "company" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "location" TEXT,
  "startDate" TIMESTAMPTZ(6) NOT NULL,
  "endDate" TIMESTAMPTZ(6),
  "isCurrent" BOOLEAN NOT NULL DEFAULT FALSE,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- EDUCATIONS
CREATE TABLE IF NOT EXISTS "educations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "school" TEXT NOT NULL,
  "degree" TEXT NOT NULL,
  "field" TEXT,
  "startDate" TIMESTAMPTZ(6) NOT NULL,
  "endDate" TIMESTAMPTZ(6),
  "isCurrent" BOOLEAN NOT NULL DEFAULT FALSE,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- CERTIFICATIONS
CREATE TABLE IF NOT EXISTS "certifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "issueDate" TIMESTAMPTZ(6),
  "expiryDate" TIMESTAMPTZ(6),
  "credentialId" TEXT,
  "credentialUrl" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS "projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT,
  "technologies" TEXT[] DEFAULT '{}',
  "startDate" TIMESTAMPTZ(6),
  "endDate" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- JOB APPLICATIONS
CREATE TABLE IF NOT EXISTS "job_applications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "jobTitle" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "location" TEXT,
  "salaryRange" TEXT,
  "jobDescription" TEXT,
  "requirements" TEXT,
  "jobPostUrl" TEXT,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'WISHLIST',
  "appliedDate" TIMESTAMPTZ(6),
  "source" "JobPlatform",
  "notes" TEXT,
  "externalJobId" TEXT,
  "externalSource" TEXT,
  "externalData" JSONB,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "interviewDate" TIMESTAMPTZ(6),
  "interviewNotes" TEXT,
  "offerAmount" TEXT,
  "offerDeadline" TIMESTAMPTZ(6),
  "isPasted" BOOLEAN NOT NULL DEFAULT FALSE,
  "isFavorite" BOOLEAN NOT NULL DEFAULT FALSE,
  "reminderDate" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "job_applications_userId_idx" ON "job_applications"("userId");
CREATE INDEX IF NOT EXISTS "job_applications_status_idx" ON "job_applications"("status");
CREATE INDEX IF NOT EXISTS "job_applications_userId_status_idx" ON "job_applications"("userId", "status");

-- JOB SEARCH PREFERENCES
CREATE TABLE IF NOT EXISTS "job_search_preferences" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "jobTitles" TEXT[] DEFAULT '{}',
  "keywords" TEXT[] DEFAULT '{}',
  "locations" TEXT[] DEFAULT '{}',
  "minSalary" INT,
  "maxSalary" INT,
  "currency" TEXT DEFAULT 'USD',
  "experienceLevel" TEXT,
  "yearsExperience" INT,
  "workTypes" TEXT[] DEFAULT '{}',
  "remoteOptions" TEXT[] DEFAULT '{}',
  "skills" TEXT[] DEFAULT '{}',
  "industries" TEXT[] DEFAULT '{}',
  "companySize" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- COVER LETTERS
CREATE TABLE IF NOT EXISTS "cover_letters" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "jobApplicationId" TEXT,
  "content" TEXT NOT NULL,
  "subject" TEXT,
  "aiModel" TEXT,
  "promptUsed" TEXT,
  "tone" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "isSent" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "cover_letters_userId_idx" ON "cover_letters"("userId");
CREATE INDEX IF NOT EXISTS "cover_letters_jobApplicationId_idx" ON "cover_letters"("jobApplicationId");
