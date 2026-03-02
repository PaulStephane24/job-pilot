"use server"

import { createClient } from "@/lib/supabase/server"
import { adminSupabase } from "@/lib/supabase/server"

interface ParsedResume {
  firstName?: string
  lastName?: string
  phone?: string
  location?: string
  headline?: string
  skills: string[]
  experiences: {
    company: string
    position: string
    location?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
    description?: string
  }[]
  educations: {
    school: string
    degree: string
    field?: string
    startDate: string
    endDate?: string
    isCurrent: boolean
  }[]
}

function parseTextToResume(text: string): ParsedResume {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const result: ParsedResume = { skills: [], experiences: [], educations: [] }

  // Name from first line (if short and not email/phone)
  if (lines.length > 0) {
    const first = lines[0]
    if (first.length < 60 && !first.includes("@") && !/^\d/.test(first)) {
      const parts = first.split(/\s+/)
      result.firstName = parts[0] || undefined
      result.lastName = parts.slice(1).join(" ") || undefined
    }
  }

  // Phone
  for (const line of lines.slice(0, 12)) {
    const m = line.match(/[\+]?[\d\s\-()]{7,15}/)
    if (m && !result.phone) result.phone = m[0].trim()
  }

  // Sections
  const sectionLabels = [
    "skills",
    "technical skills",
    "technologies",
    "competencies",
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "education",
    "formation",
    "projects",
    "certifications",
  ]
  const isSection = (l: string) =>
    sectionLabels.some((s) => l.toLowerCase().replace(/[:\-–]/g, "").trim().startsWith(s))

  // Skills
  let inSkills = false
  for (const line of lines) {
    const lower = line.toLowerCase().replace(/[:\-–]/g, "").trim()
    if (
      ["skills", "technical skills", "technologies", "competencies"].some(
        (k) => lower.startsWith(k)
      ) &&
      lower.length < 40
    ) {
      inSkills = true
      // If skills are on same line as header
      const after = line.replace(/^[^:]+:\s*/, "")
      if (after !== line && after.length > 2) {
        result.skills.push(
          ...after
            .split(/[,;|•·]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 1 && s.length < 50)
        )
      }
      continue
    }
    if (inSkills && isSection(line) && !["skills", "technical skills", "technologies", "competencies"].some((k) => lower.startsWith(k))) {
      inSkills = false
      continue
    }
    if (inSkills) {
      result.skills.push(
        ...line
          .split(/[,;|•·\t]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 1 && s.length < 50)
      )
    }
  }
  result.skills = [...new Set(result.skills)].slice(0, 30)

  // Experience
  let inExp = false
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().replace(/[:\-–]/g, "").trim()
    if (
      ["experience", "work experience", "professional experience", "employment"].some(
        (k) => lower.startsWith(k)
      ) &&
      lower.length < 40
    ) {
      inExp = true
      continue
    }
    if (
      inExp &&
      ["education", "formation", "skills", "certifications", "projects"].some(
        (k) => lower.startsWith(k)
      ) &&
      lower.length < 40
    ) {
      inExp = false
      continue
    }
    if (inExp) {
      const dm = lines[i].match(
        /(\d{4})\s*[-–—]\s*(\d{4}|present|current|aujourd|ongoing)/i
      )
      if (dm) {
        const prev = i > 0 && !lines[i - 1].match(/\d{4}/) ? lines[i - 1] : lines[i]
        const parts = prev.split(/[,\-–—|@]/)
        result.experiences.push({
          position: parts[0]?.trim() || "Position",
          company: parts[1]?.trim() || prev,
          startDate: new Date(`${dm[1]}-01-01`).toISOString(),
          endDate: dm[2].match(/\d{4}/)
            ? new Date(`${dm[2]}-01-01`).toISOString()
            : undefined,
          isCurrent: !dm[2].match(/\d{4}/),
        })
      }
    }
  }

  // Education
  let inEdu = false
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().replace(/[:\-–]/g, "").trim()
    if (
      ["education", "formation", "academic"].some((k) => lower.startsWith(k)) &&
      lower.length < 40
    ) {
      inEdu = true
      continue
    }
    if (
      inEdu &&
      ["experience", "skills", "certifications", "projects"].some(
        (k) => lower.startsWith(k)
      ) &&
      lower.length < 40
    ) {
      inEdu = false
      continue
    }
    if (inEdu) {
      const dm = lines[i].match(
        /(\d{4})\s*[-–—]\s*(\d{4}|present|current|aujourd|ongoing)/i
      )
      if (dm) {
        const prev = i > 0 && !lines[i - 1].match(/\d{4}/) ? lines[i - 1] : lines[i]
        const parts = prev.split(/[,\-–—|]/)
        result.educations.push({
          degree: parts[0]?.trim() || "Degree",
          school: parts[1]?.trim() || prev,
          startDate: new Date(`${dm[1]}-01-01`).toISOString(),
          endDate: dm[2].match(/\d{4}/)
            ? new Date(`${dm[2]}-01-01`).toISOString()
            : undefined,
          isCurrent: !dm[2].match(/\d{4}/),
        })
      }
    }
  }

  return result
}

export async function uploadAndParseResume(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const file = formData.get("file") as File
  if (!file) return { data: null, error: "No file provided" }

  const { type: fileType, name: fileName, size: fileSize } = file

  if (fileSize > 5 * 1024 * 1024) {
    return { data: null, error: "File too large (max 5 MB)." }
  }
  if (
    fileType !== "application/pdf" &&
    fileType !==
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return { data: null, error: "Only PDF and DOCX files are supported." }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ""

    if (fileType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default
      const pdf = await pdfParse(buffer)
      extractedText = pdf.text
    } else {
      const mammoth = await import("mammoth")
      const { value } = await mammoth.extractRawText({ buffer })
      extractedText = value
    }

    const parsed = parseTextToResume(extractedText)

    // Upload to Supabase Storage
    const filePath = `resumes/${user.id}/${Date.now()}-${fileName}`
    const { error: upErr } = await adminSupabase.storage
      .from("resumes")
      .upload(filePath, buffer, { contentType: fileType, upsert: true })

    if (upErr?.message?.includes("not found")) {
      await adminSupabase.storage.createBucket("resumes", { public: false })
      await adminSupabase.storage
        .from("resumes")
        .upload(filePath, buffer, { contentType: fileType, upsert: true })
    }

    const { data: urlData } = adminSupabase.storage
      .from("resumes")
      .getPublicUrl(filePath)
    const fileUrl = urlData?.publicUrl ?? filePath

    // Deactivate old resumes
    await adminSupabase
      .from("resumes")
      .update({ isActive: false })
      .eq("userId", user.id)

    // Insert resume record
    const { data: resume, error: rErr } = await adminSupabase
      .from("resumes")
      .insert({
        userId: user.id,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        isActive: true,
        parsedData: parsed as unknown as Record<string, unknown>,
      })
      .select()
      .single()

    if (rErr) return { data: null, error: rErr.message }

    // Get or create profile
    let { data: profile } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("userId", user.id)
      .single()

    if (!profile) {
      const { data: np } = await adminSupabase
        .from("profiles")
        .insert({ userId: user.id })
        .select("id")
        .single()
      profile = np
    }

    if (profile) {
      // Update profile fields
      const upd: Record<string, unknown> = {
        resumeUrl: fileUrl,
        updatedAt: new Date().toISOString(),
      }
      if (parsed.firstName) upd.firstName = parsed.firstName
      if (parsed.lastName) upd.lastName = parsed.lastName
      if (parsed.phone) upd.phone = parsed.phone
      if (parsed.headline) upd.headline = parsed.headline

      await adminSupabase.from("profiles").update(upd).eq("id", profile.id)

      // Skills
      if (parsed.skills.length > 0) {
        await adminSupabase.from("skills").delete().eq("profileId", profile.id)
        await adminSupabase
          .from("skills")
          .insert(parsed.skills.map((name) => ({ profileId: profile!.id, name })))
      }

      // Experiences
      if (parsed.experiences.length > 0) {
        await adminSupabase.from("experiences").delete().eq("profileId", profile.id)
        await adminSupabase
          .from("experiences")
          .insert(parsed.experiences.map((e) => ({ profileId: profile!.id, ...e })))
      }

      // Educations
      if (parsed.educations.length > 0) {
        await adminSupabase.from("educations").delete().eq("profileId", profile.id)
        await adminSupabase
          .from("educations")
          .insert(parsed.educations.map((e) => ({ profileId: profile!.id, ...e })))
      }
    }

    return { data: { resume, parsed }, error: null }
  } catch (err: any) {
    console.error("Resume parse error:", err)
    return { data: null, error: err.message || "Failed to parse resume" }
  }
}

export async function getActiveResume() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const { data, error } = await adminSupabase
    .from("resumes")
    .select("*")
    .eq("userId", user.id)
    .eq("isActive", true)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle()

  return { data, error: error?.message ?? null }
}

export async function listResumes() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: null, error: "Not authenticated" }

  const { data, error } = await adminSupabase
    .from("resumes")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })

  return { data: data ?? [], error: error?.message ?? null }
}
