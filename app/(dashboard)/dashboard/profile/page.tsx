import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileClient } from "@/components/profile/profile-client"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("userId", user.id)
    .maybeSingle()

  // Fetch skills
  const { data: skills } = await supabase
    .from("skills")
    .select("*")
    .eq("profileId", profile?.id)
    .order("createdAt", { ascending: false })

  // Fetch experiences
  const { data: experiences } = await supabase
    .from("experiences")
    .select("*")
    .eq("profileId", profile?.id)
    .order("startDate", { ascending: false })

  // Fetch educations
  const { data: educations } = await supabase
    .from("educations")
    .select("*")
    .eq("profileId", profile?.id)
    .order("startDate", { ascending: false })

  // Fetch certifications
  const { data: certifications } = await supabase
    .from("certifications")
    .select("*")
    .eq("profileId", profile?.id)
    .order("createdAt", { ascending: false })

  // Fetch resumes
  const { data: resumes } = await supabase
    .from("resumes")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })

  return (
    <ProfileClient
      userEmail={user.email ?? ""}
      profile={profile}
      skills={skills ?? []}
      experiences={experiences ?? []}
      educations={educations ?? []}
      certifications={certifications ?? []}
      resumes={resumes ?? []}
    />
  )
}
