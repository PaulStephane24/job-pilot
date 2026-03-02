import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Fetch stats
  const { data: applications } = await supabase
    .from("job_applications")
    .select("id, status")
    .eq("userId", user.id)

  const { data: profile } = await supabase
    .from("profiles")
    .select("firstName")
    .eq("userId", user.id)
    .single()

  const { data: coverLetters } = await supabase
    .from("cover_letters")
    .select("id")
    .eq("userId", user.id)

  const apps = applications ?? []
  const firstName = profile?.firstName ?? user.email?.split("@")[0] ?? "there"

  const stats = {
    total: apps.length,
    applied: apps.filter((a) => a.status === "APPLIED").length,
    interviewing: apps.filter((a) => a.status === "INTERVIEWING").length,
    offered: apps.filter((a) => a.status === "OFFERED").length,
    rejected: apps.filter((a) => a.status === "REJECTED").length,
    wishlist: apps.filter((a) => a.status === "WISHLIST").length,
    coverLetters: coverLetters?.length ?? 0,
  }

  return <DashboardContent firstName={firstName} stats={stats} />
}
