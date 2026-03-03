import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { JobsClient } from "@/components/jobs/jobs-client"

export default async function JobsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: applications } = await supabase
    .from("job_applications")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })

  return <JobsClient applications={applications ?? []} userId={user.id} />
}
