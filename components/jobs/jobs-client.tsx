"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Briefcase,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Star,
  StarOff,
  Filter,
  Loader2,
  X,
  Calendar,
  Building2,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"

const STATUS_OPTIONS = [
  { value: "WISHLIST", label: "Wishlist", color: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800" },
  { value: "APPLIED", label: "Applied", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  { value: "INTERVIEWING", label: "Interviewing", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  { value: "OFFERED", label: "Offered", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" },
  { value: "REJECTED", label: "Rejected", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
  { value: "WITHDRAWN", label: "Withdrawn", color: "bg-muted text-muted-foreground border-border" },
]

const SOURCE_OPTIONS = [
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "INDEED", label: "Indeed" },
  { value: "GLASSDOOR", label: "Glassdoor" },
  { value: "COMPANY_WEBSITE", label: "Company Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "OTHER", label: "Other" },
]

function getStatusStyle(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color ?? "bg-muted text-muted-foreground border-border"
}

function getStatusLabel(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status
}

interface JobsClientProps {
  applications: any[]
  userId: string
}

export function JobsClient({ applications: initialApps, userId }: JobsClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState({
    jobTitle: "",
    company: "",
    location: "",
    status: "WISHLIST",
    source: "OTHER",
    jobPostUrl: "",
    jobDescription: "",
    notes: "",
    salaryRange: "",
    contactName: "",
    contactEmail: "",
  })

  const filtered = initialApps.filter((app) => {
    const matchesSearch =
      !search ||
      app.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
      app.company?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = STATUS_OPTIONS.map((s) => ({
    ...s,
    count: initialApps.filter((a) => a.status === s.value).length,
  }))

  const handleAdd = async () => {
    if (!form.jobTitle.trim() || !form.company.trim()) {
      toast({ title: "Missing fields", description: "Job title and company are required.", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase.from("job_applications").insert({
        userId,
        jobTitle: form.jobTitle,
        company: form.company,
        location: form.location || null,
        status: form.status,
        source: form.source,
        jobPostUrl: form.jobPostUrl || null,
        jobDescription: form.jobDescription || null,
        notes: form.notes || null,
        salaryRange: form.salaryRange || null,
        contactName: form.contactName || null,
        contactEmail: form.contactEmail || null,
        appliedDate: form.status !== "WISHLIST" ? new Date().toISOString() : null,
      })

      if (error) throw error

      toast({ title: "Application added", description: `${form.jobTitle} at ${form.company}` })
      setShowAddDialog(false)
      setForm({
        jobTitle: "",
        company: "",
        location: "",
        status: "WISHLIST",
        source: "OTHER",
        jobPostUrl: "",
        jobDescription: "",
        notes: "",
        salaryRange: "",
        contactName: "",
        contactEmail: "",
      })
      router.refresh()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add application.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("job_applications")
      .update({
        status: newStatus,
        appliedDate: newStatus !== "WISHLIST" ? new Date().toISOString() : null,
      })
      .eq("id", id)

    if (!error) {
      router.refresh()
    }
  }

  const handleToggleFavorite = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ isFavorite: !current })
      .eq("id", id)

    if (!error) router.refresh()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("job_applications").delete().eq("id", id)
    if (!error) {
      toast({ title: "Application removed" })
      router.refresh()
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {statusCounts.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(statusFilter === s.value ? "ALL" : s.value)}
            className={`rounded-lg border p-3 text-center transition-colors ${
              statusFilter === s.value ? "ring-2 ring-primary" : ""
            } ${s.color}`}
          >
            <p className="text-xl font-bold">{s.count}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {statusFilter !== "ALL" && (
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter("ALL")}>
              <X className="mr-1 h-3 w-3" /> Clear filter
            </Button>
          )}
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Application
          </Button>
        </div>
      </div>

      {/* Applications List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground">
              {initialApps.length === 0 ? "No applications yet" : "No matching applications"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {initialApps.length === 0
                ? "Start tracking your job applications by adding your first one."
                : "Try adjusting your search or filter."}
            </p>
            {initialApps.length === 0 && (
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Application
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Card key={app.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 pt-5">
                {/* Favorite */}
                <button
                  onClick={() => handleToggleFavorite(app.id, app.isFavorite)}
                  className="mt-0.5 shrink-0"
                >
                  {app.isFavorite ? (
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ) : (
                    <StarOff className="h-5 w-5 text-muted-foreground/40 hover:text-amber-400" />
                  )}
                </button>

                {/* Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{app.jobTitle}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" /> {app.company}
                        </span>
                        {app.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {app.location}
                          </span>
                        )}
                        {app.salaryRange && (
                          <span className="text-xs text-muted-foreground">{app.salaryRange}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Select
                        value={app.status}
                        onValueChange={(val) => handleStatusChange(app.id, val)}
                      >
                        <SelectTrigger className="h-8 w-auto">
                          <Badge variant="outline" className={getStatusStyle(app.status)}>
                            {getStatusLabel(app.status)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {app.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{app.notes}</p>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    {app.appliedDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(app.appliedDate).toLocaleDateString()}
                      </span>
                    )}
                    {app.source && (
                      <Badge variant="outline" className="text-xs">
                        {SOURCE_OPTIONS.find((s) => s.value === app.source)?.label ?? app.source}
                      </Badge>
                    )}
                    {app.jobPostUrl && (
                      <a
                        href={app.jobPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Job Post
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="ml-auto flex items-center gap-1 text-xs text-destructive hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Application Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Job Application</DialogTitle>
            <DialogDescription>Track a new job application.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Job Title *</Label>
              <Input
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                placeholder="e.g. Frontend Developer"
              />
            </div>
            <div className="grid gap-2">
              <Label>Company *</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                placeholder="e.g. Google"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Remote"
                />
              </div>
              <div className="grid gap-2">
                <Label>Salary Range</Label>
                <Input
                  value={form.salaryRange}
                  onChange={(e) => setForm((p) => ({ ...p, salaryRange: e.target.value }))}
                  placeholder="e.g. $80k-$120k"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(val) => setForm((p) => ({ ...p, status: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(val) => setForm((p) => ({ ...p, source: val }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Job Post URL</Label>
              <Input
                value={form.jobPostUrl}
                onChange={(e) => setForm((p) => ({ ...p, jobPostUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Job Description</Label>
              <Textarea
                value={form.jobDescription}
                onChange={(e) => setForm((p) => ({ ...p, jobDescription: e.target.value }))}
                placeholder="Paste the job description here..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Contact Name</Label>
                <Input
                  value={form.contactName}
                  onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                  placeholder="Recruiter name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Contact Email</Label>
                <Input
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  placeholder="recruiter@company.com"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Personal notes about this application..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
