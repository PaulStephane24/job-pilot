"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Briefcase,
  GraduationCap,
  Award,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Upload,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { upsertProfile } from "@/lib/actions/profile.action"
import { createSkill, deleteSkill } from "@/lib/actions/skill.action"
import { createExperience, updateExperience, deleteExperience } from "@/lib/actions/experience.action"
import { createEducation, updateEducation, deleteEducation } from "@/lib/actions/education.action"
import { createCertification, deleteCertification } from "@/lib/actions/certification.action"
import { supabase } from "@/lib/supabase/client"

interface ProfileClientProps {
  userEmail: string
  profile: any
  skills: any[]
  experiences: any[]
  educations: any[]
  certifications: any[]
  resumes: any[]
}

export function ProfileClient({
  userEmail,
  profile: initialProfile,
  skills: initialSkills,
  experiences: initialExperiences,
  educations: initialEducations,
  certifications: initialCertifications,
  resumes: initialResumes,
}: ProfileClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Profile form
  const [form, setForm] = useState({
    firstName: initialProfile?.firstName ?? "",
    lastName: initialProfile?.lastName ?? "",
    headline: initialProfile?.headline ?? "",
    phone: initialProfile?.phone ?? "",
    location: initialProfile?.location ?? "",
    bio: initialProfile?.bio ?? "",
    website: initialProfile?.website ?? "",
    linkedinUrl: initialProfile?.linkedinUrl ?? "",
    githubUrl: initialProfile?.githubUrl ?? "",
  })

  // Dialog states
  const [skillDialog, setSkillDialog] = useState(false)
  const [expDialog, setExpDialog] = useState(false)
  const [eduDialog, setEduDialog] = useState(false)
  const [certDialog, setCertDialog] = useState(false)

  const [newSkill, setNewSkill] = useState({ name: "", level: 3, category: "Technical" })
  const [newExp, setNewExp] = useState({
    position: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: ""
  })
  const [newEdu, setNewEdu] = useState({
    school: "", degree: "", field: "", startDate: "", endDate: "", isCurrent: false, description: ""
  })
  const [newCert, setNewCert] = useState({
    name: "", issuer: "", issueDate: "", expiryDate: "", credentialUrl: ""
  })

  const profileId = initialProfile?.id

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const { error } = await upsertProfile(form)
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" })
      } else {
        toast({ title: "Profile updated", description: "Your changes have been saved." })
        setIsEditing(false)
        router.refresh()
      }
    } catch {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSkill = async () => {
    if (!newSkill.name.trim() || !profileId) return
    const { error } = await createSkill(profileId, newSkill)
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" })
    } else {
      toast({ title: "Skill added" })
      setSkillDialog(false)
      setNewSkill({ name: "", level: 3, category: "Technical" })
      router.refresh()
    }
  }

  const handleDeleteSkill = async (id: string) => {
    const { error } = await deleteSkill(id)
    if (!error) router.refresh()
  }

  const handleAddExperience = async () => {
    if (!newExp.position.trim() || !newExp.company.trim() || !profileId) return
    const payload = {
      title: newExp.position,
      company: newExp.company,
      location: newExp.location,
      startDate: newExp.startDate,
      endDate: newExp.isCurrent ? undefined : newExp.endDate,
      isCurrent: newExp.isCurrent,
      description: newExp.description,
    }
    const { error } = await createExperience(profileId, payload)
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" })
    } else {
      toast({ title: "Experience added" })
      setExpDialog(false)
      setNewExp({ position: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" })
      router.refresh()
    }
  }

  const handleDeleteExperience = async (id: string) => {
    const { error } = await deleteExperience(id)
    if (!error) router.refresh()
  }

  const handleAddEducation = async () => {
    if (!newEdu.school.trim() || !newEdu.degree.trim() || !profileId) return
    const payload = {
      institution: newEdu.school,
      degree: newEdu.degree,
      field: newEdu.field,
      startDate: newEdu.startDate,
      endDate: newEdu.isCurrent ? undefined : newEdu.endDate,
      isCurrent: newEdu.isCurrent,
      description: newEdu.description,
    }
    const { error } = await createEducation(profileId, payload)
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" })
    } else {
      toast({ title: "Education added" })
      setEduDialog(false)
      setNewEdu({ school: "", degree: "", field: "", startDate: "", endDate: "", isCurrent: false, description: "" })
      router.refresh()
    }
  }

  const handleDeleteEducation = async (id: string) => {
    const { error } = await deleteEducation(id)
    if (!error) router.refresh()
  }

  const handleAddCertification = async () => {
    if (!newCert.name.trim() || !newCert.issuer.trim()) return
    const { error } = await createCertification({
      name: newCert.name,
      issuer: newCert.issuer,
      issueDate: newCert.issueDate || new Date().toISOString(),
      expiryDate: newCert.expiryDate || undefined,
      credentialUrl: newCert.credentialUrl || undefined,
    })
    if (error) {
      toast({ title: "Error", description: error, variant: "destructive" })
    } else {
      toast({ title: "Certification added" })
      setCertDialog(false)
      setNewCert({ name: "", issuer: "", issueDate: "", expiryDate: "", credentialUrl: "" })
      router.refresh()
    }
  }

  const handleDeleteCertification = async (id: string) => {
    const { error } = await deleteCertification(id)
    if (!error) router.refresh()
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or DOCX file.", variant: "destructive" })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 10MB.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const ext = file.name.split(".").pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("resumes-files")
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) throw uploadError

      // Insert resume record
      const { error: insertError } = await supabase.from("resumes").insert({
        userId: user.id,
        fileName: file.name,
        fileUrl: path,
        fileType: file.type,
        fileSize: file.size,
        isActive: true,
      })

      if (insertError) throw insertError

      toast({ title: "Resume uploaded", description: "Your resume has been uploaded successfully." })
      router.refresh()
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Something went wrong.", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return "Present"
    return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ") || userEmail.split("@")[0]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Profile Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-8 w-8" />
              </div>
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="First name"
                      value={form.firstName}
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      className="w-36"
                    />
                    <Input
                      placeholder="Last name"
                      value={form.lastName}
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      className="w-36"
                    />
                  </div>
                ) : (
                  <CardTitle className="text-xl">{fullName}</CardTitle>
                )}
                {isEditing ? (
                  <Input
                    placeholder="Headline (e.g. Full-Stack Developer)"
                    value={form.headline}
                    onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                    className="mt-1"
                  />
                ) : (
                  <CardDescription className="text-sm">
                    {initialProfile?.headline || "No headline set"}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 8900" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Location</Label>
                      <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Website</Label>
                      <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>LinkedIn</Label>
                      <Input value={form.linkedinUrl} onChange={(e) => setForm((p) => ({ ...p, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="grid gap-2">
                      <Label>GitHub</Label>
                      <Input value={form.githubUrl} onChange={(e) => setForm((p) => ({ ...p, githubUrl: e.target.value }))} placeholder="https://github.com/..." />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" /> {userEmail}
                    </div>
                    {form.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" /> {form.phone}
                      </div>
                    )}
                    {form.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {form.location}
                      </div>
                    )}
                    {form.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" /> {form.website}
                      </div>
                    )}
                    {form.linkedinUrl && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Linkedin className="h-4 w-4" /> {form.linkedinUrl}
                      </div>
                    )}
                    {form.githubUrl && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Github className="h-4 w-4" /> {form.githubUrl}
                      </div>
                    )}
                    {!form.phone && !form.location && !form.website && (
                      <p className="text-muted-foreground">No contact info added yet. Click Edit Profile to add.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Write a short bio about yourself..."
                    rows={6}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {initialProfile?.bio || "No bio added yet. Click Edit Profile to add one."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-foreground">{initialExperiences.length}</p>
                <p className="text-xs text-muted-foreground">Experiences</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-foreground">{initialEducations.length}</p>
                <p className="text-xs text-muted-foreground">Education</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-foreground">{initialSkills.length}</p>
                <p className="text-xs text-muted-foreground">Skills</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-foreground">{initialResumes.length}</p>
                <p className="text-xs text-muted-foreground">Resumes</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Experience */}
        <TabsContent value="experience" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Work Experience</h3>
            <Button size="sm" onClick={() => setExpDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Experience
            </Button>
          </div>
          {initialExperiences.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No experience added yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setExpDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add your first experience
                </Button>
              </CardContent>
            </Card>
          ) : (
            initialExperiences.map((exp: any) => (
              <Card key={exp.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{exp.position}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exp.company} {exp.location ? `- ${exp.location}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exp.startDate)} - {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteExperience(exp.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {exp.description && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Education */}
        <TabsContent value="education" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Education</h3>
            <Button size="sm" onClick={() => setEduDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Education
            </Button>
          </div>
          {initialEducations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No education added yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setEduDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add your first education
                </Button>
              </CardContent>
            </Card>
          ) : (
            initialEducations.map((edu: any) => (
              <Card key={edu.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{edu.degree} in {edu.field}</h4>
                      <p className="text-sm text-muted-foreground">{edu.school}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(edu.startDate)} - {edu.isCurrent ? "Present" : formatDate(edu.endDate)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteEducation(edu.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Skills</h3>
            <Button size="sm" onClick={() => setSkillDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Skill
            </Button>
          </div>
          {initialSkills.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No skills added yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  {initialSkills.map((skill: any) => (
                    <Badge key={skill.id} variant="secondary" className="gap-1 px-3 py-1.5 text-sm">
                      {skill.name}
                      {skill.category && (
                        <span className="text-xs text-muted-foreground">({skill.category})</span>
                      )}
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Resume */}
        <TabsContent value="resume" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Resumes</h3>
            <div>
              <label htmlFor="resume-upload">
                <Button size="sm" asChild disabled={isUploading}>
                  <span>
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Resume
                  </span>
                </Button>
              </label>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleResumeUpload}
                disabled={isUploading}
              />
            </div>
          </div>
          {initialResumes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No resumes uploaded yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">Upload a PDF or DOCX to get started.</p>
              </CardContent>
            </Card>
          ) : (
            initialResumes.map((resume: any) => (
              <Card key={resume.id}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{resume.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(resume.fileSize / 1024).toFixed(0)} KB - Uploaded {formatDate(resume.createdAt)}
                      </p>
                    </div>
                  </div>
                  {resume.isActive && <Badge>Active</Badge>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Certifications section */}
      {initialCertifications.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Certifications</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setCertDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {initialCertifications.map((cert: any) => (
              <div key={cert.id} className="flex items-start justify-between rounded-md border border-border p-3">
                <div>
                  <p className="font-medium text-foreground">{cert.name}</p>
                  <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                  {cert.issueDate && (
                    <p className="text-xs text-muted-foreground">{formatDate(cert.issueDate)}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCertification(cert.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {initialCertifications.length === 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Certifications</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setCertDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No certifications added yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Add Skill Dialog */}
      <Dialog open={skillDialog} onOpenChange={setSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>Add a new skill to your profile.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Skill Name</Label>
              <Input value={newSkill.name} onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. React, Python" />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={newSkill.category} onChange={(e) => setNewSkill((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Technical, Soft Skills" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSkill}>Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Experience Dialog */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Experience</DialogTitle>
            <DialogDescription>Add a new work experience.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Job Title</Label>
              <Input value={newExp.position} onChange={(e) => setNewExp((p) => ({ ...p, position: e.target.value }))} placeholder="e.g. Software Engineer" />
            </div>
            <div className="grid gap-2">
              <Label>Company</Label>
              <Input value={newExp.company} onChange={(e) => setNewExp((p) => ({ ...p, company: e.target.value }))} placeholder="e.g. Google" />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input value={newExp.location} onChange={(e) => setNewExp((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. San Francisco, CA" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={newExp.startDate} onChange={(e) => setNewExp((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={newExp.endDate} onChange={(e) => setNewExp((p) => ({ ...p, endDate: e.target.value }))} disabled={newExp.isCurrent} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="exp-current"
                checked={newExp.isCurrent}
                onChange={(e) => setNewExp((p) => ({ ...p, isCurrent: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="exp-current">I currently work here</Label>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={newExp.description} onChange={(e) => setNewExp((p) => ({ ...p, description: e.target.value }))} placeholder="Describe your responsibilities..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialog(false)}>Cancel</Button>
            <Button onClick={handleAddExperience}>Add Experience</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={eduDialog} onOpenChange={setEduDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
            <DialogDescription>Add your educational background.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>School / University</Label>
              <Input value={newEdu.school} onChange={(e) => setNewEdu((p) => ({ ...p, school: e.target.value }))} placeholder="e.g. MIT" />
            </div>
            <div className="grid gap-2">
              <Label>Degree</Label>
              <Input value={newEdu.degree} onChange={(e) => setNewEdu((p) => ({ ...p, degree: e.target.value }))} placeholder="e.g. Bachelor's" />
            </div>
            <div className="grid gap-2">
              <Label>Field of Study</Label>
              <Input value={newEdu.field} onChange={(e) => setNewEdu((p) => ({ ...p, field: e.target.value }))} placeholder="e.g. Computer Science" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={newEdu.startDate} onChange={(e) => setNewEdu((p) => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={newEdu.endDate} onChange={(e) => setNewEdu((p) => ({ ...p, endDate: e.target.value }))} disabled={newEdu.isCurrent} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edu-current"
                checked={newEdu.isCurrent}
                onChange={(e) => setNewEdu((p) => ({ ...p, isCurrent: e.target.checked }))}
                className="rounded border-border"
              />
              <Label htmlFor="edu-current">Currently studying here</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEduDialog(false)}>Cancel</Button>
            <Button onClick={handleAddEducation}>Add Education</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={certDialog} onOpenChange={setCertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
            <DialogDescription>Add a professional certification.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Certification Name</Label>
              <Input value={newCert.name} onChange={(e) => setNewCert((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. AWS Solutions Architect" />
            </div>
            <div className="grid gap-2">
              <Label>Issuer</Label>
              <Input value={newCert.issuer} onChange={(e) => setNewCert((p) => ({ ...p, issuer: e.target.value }))} placeholder="e.g. Amazon Web Services" />
            </div>
            <div className="grid gap-2">
              <Label>Issue Date</Label>
              <Input type="date" value={newCert.issueDate} onChange={(e) => setNewCert((p) => ({ ...p, issueDate: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Credential URL (optional)</Label>
              <Input value={newCert.credentialUrl} onChange={(e) => setNewCert((p) => ({ ...p, credentialUrl: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCertification}>Add Certification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
