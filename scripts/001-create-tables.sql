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

-- USERS (references auth.users)
CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "email" TEXT NOT NULL UNIQUE,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON "users" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON "users" FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON "users" FOR UPDATE USING (auth.uid() = id);

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

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON "profiles" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "profiles_insert_own" ON "profiles" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "profiles_update_own" ON "profiles" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "profiles_delete_own" ON "profiles" FOR DELETE USING (auth.uid() = "userId");

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

ALTER TABLE "resumes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resumes_select_own" ON "resumes" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "resumes_insert_own" ON "resumes" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "resumes_update_own" ON "resumes" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "resumes_delete_own" ON "resumes" FOR DELETE USING (auth.uid() = "userId");

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

ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills_select_own" ON "skills" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "skills"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "skills_insert_own" ON "skills" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "skills"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "skills_update_own" ON "skills" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "skills"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "skills_delete_own" ON "skills" FOR DELETE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "skills"."profileId" AND "profiles"."userId" = auth.uid()));

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

ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experiences_select_own" ON "experiences" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "experiences"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "experiences_insert_own" ON "experiences" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "experiences"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "experiences_update_own" ON "experiences" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "experiences"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "experiences_delete_own" ON "experiences" FOR DELETE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "experiences"."profileId" AND "profiles"."userId" = auth.uid()));

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

ALTER TABLE "educations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "educations_select_own" ON "educations" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "educations"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "educations_insert_own" ON "educations" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "educations"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "educations_update_own" ON "educations" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "educations"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "educations_delete_own" ON "educations" FOR DELETE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "educations"."profileId" AND "profiles"."userId" = auth.uid()));

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

ALTER TABLE "certifications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certifications_select_own" ON "certifications" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "certifications"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "certifications_insert_own" ON "certifications" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "certifications"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "certifications_update_own" ON "certifications" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "certifications"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "certifications_delete_own" ON "certifications" FOR DELETE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "certifications"."profileId" AND "profiles"."userId" = auth.uid()));

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

ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select_own" ON "projects" FOR SELECT
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "projects"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "projects_insert_own" ON "projects" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "projects"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "projects_update_own" ON "projects" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "projects"."profileId" AND "profiles"."userId" = auth.uid()));
CREATE POLICY "projects_delete_own" ON "projects" FOR DELETE
  USING (EXISTS (SELECT 1 FROM "profiles" WHERE "profiles"."id" = "projects"."profileId" AND "profiles"."userId" = auth.uid()));

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

ALTER TABLE "job_applications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_applications_select_own" ON "job_applications" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "job_applications_insert_own" ON "job_applications" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "job_applications_update_own" ON "job_applications" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "job_applications_delete_own" ON "job_applications" FOR DELETE USING (auth.uid() = "userId");

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

ALTER TABLE "job_search_preferences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "job_search_preferences_select_own" ON "job_search_preferences" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "job_search_preferences_insert_own" ON "job_search_preferences" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "job_search_preferences_update_own" ON "job_search_preferences" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "job_search_preferences_delete_own" ON "job_search_preferences" FOR DELETE USING (auth.uid() = "userId");

-- COVER LETTERS
CREATE TABLE IF NOT EXISTS "cover_letters" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "jobApplicationId" UUID REFERENCES "job_applications"("id") ON DELETE SET NULL,
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

ALTER TABLE "cover_letters" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cover_letters_select_own" ON "cover_letters" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "cover_letters_insert_own" ON "cover_letters" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "cover_letters_update_own" ON "cover_letters" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "cover_letters_delete_own" ON "cover_letters" FOR DELETE USING (auth.uid() = "userId");

-- AUTO-CREATE USER + PROFILE ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'USER')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles ("userId", "firstName", "lastName")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL)
  )
  ON CONFLICT ("userId") DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
