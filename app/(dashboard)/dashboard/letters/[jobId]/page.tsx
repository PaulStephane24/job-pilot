"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  FileText,
  Briefcase,
  Building,
  Copy,
  Download,
  RefreshCw,
  Edit2,
  Save,
  Wand2,
  Zap,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronDown,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  generateCoverLetter,
  improveCoverLetter,
  updateCoverLetter,
  getCoverLettersForJob,
  getCoverLetterTemplates,
  type CoverLetterTemplateData,
} from "@/lib/actions/cover-letter.action"
import { getJobApplication } from "@/lib/actions/job-application.action"
import { toast } from "@/components/ui/use-toast"

type Tone = "professional" | "friendly" | "formal" | "enthusiastic"

interface CoverLetterData {
  id: string | null
  content: string
  subject: string
  tone: string
  createdAt: string
}

const toneOptions: { value: Tone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Formal and polished" },
  { value: "enthusiastic", label: "Enthusiastic", desc: "Energetic and passionate" },
  { value: "formal", label: "Formal", desc: "Traditional business tone" },
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
]

export default function CoverLetterGeneratorPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = use(params)
  const router = useRouter()

  // Job application data
  const [jobApp, setJobApp] = useState<{
    id: string
    jobTitle: string
    company: string
    description?: string
    status: string
  } | null>(null)
  const [isLoadingJob, setIsLoadingJob] = useState(true)
  const [jobError, setJobError] = useState<string | null>(null)

  // Generation state
  const [step, setStep] = useState<"configure" | "result">("configure")
  const [isGenerating, setIsGenerating] = useState(false)
  const [tone, setTone] = useState<Tone>("professional")
  const [customInstructions, setCustomInstructions] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<CoverLetterTemplateData[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState("__default")

  // Generated letter
  const [coverLetter, setCoverLetter] = useState<CoverLetterData | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [editedSubject, setEditedSubject] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Previous letters
  const [previousLetters, setPreviousLetters] = useState<CoverLetterData[]>([])

  // AI improve
  const [showImproveInput, setShowImproveInput] = useState(false)
  const [improveFeedback, setImproveFeedback] = useState("")
  const [isImproving, setIsImproving] = useState(false)

  // Load job application and templates on mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingJob(true)
      try {
        const [jobResult, templatesResult, lettersResult] = await Promise.all([
          getJobApplication(jobId),
          getCoverLetterTemplates(),
          getCoverLettersForJob(jobId),
        ])

        if (jobResult.error || !jobResult.data) {
          setJobError(jobResult.error || "Job application not found")
          return
        }

        setJobApp({
          id: jobResult.data.id,
          jobTitle: jobResult.data.jobTitle,
          company: jobResult.data.company,
          description: jobResult.data.description,
          status: jobResult.data.status,
        })

        if (templatesResult.data) {
          setTemplates(templatesResult.data)
        }

        if (lettersResult.data && lettersResult.data.length > 0) {
          const mapped = lettersResult.data.map((l: any) => ({
            id: l.id,
            content: l.content,
            subject: l.subject || "",
            tone: l.tone || "professional",
            createdAt: l.createdAt,
          }))
          setPreviousLetters(mapped)
        }
      } catch (err) {
        setJobError("Failed to load job application")
      } finally {
        setIsLoadingJob(false)
      }
    }

    loadData()
  }, [jobId])

  const handleGenerate = async () => {
    if (!jobApp) return

    setIsGenerating(true)
    try {
      const result = await generateCoverLetter({
        jobApplicationId: jobApp.id,
        tone,
        customInstructions: customInstructions || undefined,
        templateId:
          selectedTemplateId === "__default" ? undefined : selectedTemplateId,
      })

      if (result.data) {
        const newLetter: CoverLetterData = {
          id: result.data.id || null,
          content: result.data.content,
          subject:
            result.data.subject || `Application for ${jobApp.jobTitle}`,
          tone,
          createdAt: new Date().toISOString(),
        }
        setCoverLetter(newLetter)
        setEditedContent(newLetter.content)
        setEditedSubject(newLetter.subject)
        setStep("result")

        toast({
          title: "Cover Letter Generated",
          description:
            "Your AI cover letter is ready. Review and edit as needed.",
        })
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate cover letter",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImprove = async () => {
    if (!coverLetter?.id || !improveFeedback.trim()) return

    setIsImproving(true)
    try {
      const result = await improveCoverLetter({
        coverLetterId: coverLetter.id,
        feedback: improveFeedback,
      })

      if (result.data) {
        setEditedContent(result.data.content)
        setCoverLetter({ ...coverLetter, content: result.data.content })
        setImproveFeedback("")
        setShowImproveInput(false)

        toast({
          title: "Cover Letter Improved",
          description: "The AI has updated your cover letter based on your feedback.",
        })
      } else {
        toast({
          title: "Improvement Failed",
          description: result.error || "Failed to improve cover letter",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to improve cover letter",
        variant: "destructive",
      })
    } finally {
      setIsImproving(false)
    }
  }

  const handleSave = async () => {
    if (!coverLetter?.id) return

    setIsSaving(true)
    try {
      const result = await updateCoverLetter(coverLetter.id, {
        content: editedContent,
        subject: editedSubject,
      })

      if (result.data) {
        setCoverLetter({
          ...coverLetter,
          content: editedContent,
          subject: editedSubject,
        })
        setIsEditing(false)
        toast({
          title: "Saved",
          description: "Cover letter updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save cover letter",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Copied", description: "Cover letter copied to clipboard" })
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    const blob = new Blob([editedContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cover-letter-${jobApp?.company?.replace(/\s+/g, "_") || "letter"}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({ title: "Downloaded", description: "Cover letter downloaded successfully" })
  }

  const handleLoadPrevious = (letter: CoverLetterData) => {
    setCoverLetter(letter)
    setEditedContent(letter.content)
    setEditedSubject(letter.subject)
    setStep("result")
  }

  const handleRegenerate = () => {
    setStep("configure")
    setCoverLetter(null)
    setEditedContent("")
    setEditedSubject("")
    setIsEditing(false)
    setShowImproveInput(false)
  }

  const wordCount = editedContent
    ? editedContent.split(/\s+/).filter(Boolean).length
    : 0

  const hasChanges =
    coverLetter &&
    (editedContent !== coverLetter.content ||
      editedSubject !== coverLetter.subject)

  // Loading state
  if (isLoadingJob) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading job application...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (jobError || !jobApp) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Job Application Not Found
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {jobError || "The job application could not be found."}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard/jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/letters")}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  AI Cover Letter Generator
                </h1>
                <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Building className="h-3.5 w-3.5" />
                  <span>
                    {jobApp.jobTitle} at {jobApp.company}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {jobApp.status}
                  </Badge>
                </div>
              </div>
            </div>
            {step === "result" && (
              <Button onClick={handleRegenerate} variant="outline">
                <Wand2 className="mr-2 h-4 w-4" />
                New Letter
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step === "configure"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/20 text-primary"
                }`}
              >
                {step === "result" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  "1"
                )}
              </div>
              <span className="text-sm font-medium text-foreground">
                Configure
              </span>
            </div>
            <div className="h-0.5 flex-1 rounded bg-border">
              <div
                className={`h-full rounded bg-primary transition-all duration-500 ${
                  step === "result" ? "w-full" : "w-0"
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step === "result"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span
                className={`text-sm font-medium ${
                  step === "result"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Review & Edit
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Step 1: Configure */}
            {step === "configure" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
                <h2 className="mb-6 text-xl font-bold text-foreground">
                  Configure Your Cover Letter
                </h2>

                <div className="space-y-6">
                  {/* Job Info (read-only) */}
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      Job Details (from your application)
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Position
                        </p>
                        <p className="font-medium text-foreground">
                          {jobApp.jobTitle}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Company
                        </p>
                        <p className="font-medium text-foreground">
                          {jobApp.company}
                        </p>
                      </div>
                    </div>
                    {jobApp.description && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Description
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm text-foreground">
                          {jobApp.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select
                      value={selectedTemplateId}
                      onValueChange={setSelectedTemplateId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Default (AI structured)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default">
                          Default (AI structured)
                        </SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTemplateId !== "__default" && (
                      <p className="text-xs text-muted-foreground">
                        {templates.find((t) => t.id === selectedTemplateId)
                          ?.description || "Uses the selected template structure."}
                      </p>
                    )}
                  </div>

                  {/* Tone Selection */}
                  <div className="space-y-2">
                    <Label>Writing Tone</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {toneOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTone(option.value)}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            tone === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <span className="text-sm font-semibold text-foreground">
                            {option.label}
                          </span>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {option.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          showAdvanced ? "rotate-180" : ""
                        }`}
                      />
                      Advanced Options
                    </button>
                    {showAdvanced && (
                      <div className="mt-3 space-y-2">
                        <Label>Custom Instructions (optional)</Label>
                        <Textarea
                          value={customInstructions}
                          onChange={(e) =>
                            setCustomInstructions(e.target.value)
                          }
                          placeholder="E.g., Emphasize my leadership experience, mention I'm relocating, focus on my Python skills..."
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="h-12 w-full text-base"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Your Cover Letter...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Cover Letter
                      </>
                    )}
                  </Button>

                  {/* Previous Letters */}
                  {previousLetters.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="mb-2 text-sm font-medium text-foreground">
                        Previous Letters ({previousLetters.length})
                      </p>
                      <div className="space-y-2">
                        {previousLetters.slice(0, 3).map((letter, index) => (
                          <button
                            key={letter.id || index}
                            onClick={() => handleLoadPrevious(letter)}
                            className="w-full rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
                          >
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {letter.tone}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  letter.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {letter.content.substring(0, 120)}...
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Result */}
            {step === "result" && coverLetter && (
              <div className="space-y-6">
                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-foreground">
                      Cover Letter Ready
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {wordCount} words
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? (
                        <Save className="mr-2 h-4 w-4" />
                      ) : (
                        <Edit2 className="mr-2 h-4 w-4" />
                      )}
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* Subject Line */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      placeholder="Application for..."
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Letter Content */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
                  {isEditing ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={20}
                      className="min-h-[500px] resize-none font-serif text-sm leading-relaxed"
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap font-serif leading-relaxed text-foreground">
                        {editedContent}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Improve Section */}
                {coverLetter.id && (
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    {!showImproveInput ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowImproveInput(true)}
                        className="w-full"
                      >
                        <Sparkles className="mr-2 h-4 w-4 text-primary" />
                        Improve with AI
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Label>How should I improve it?</Label>
                        <Textarea
                          value={improveFeedback}
                          onChange={(e) =>
                            setImproveFeedback(e.target.value)
                          }
                          placeholder="E.g., Make it more concise, add more technical details, sound more confident..."
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleImprove}
                            disabled={
                              isImproving || !improveFeedback.trim()
                            }
                          >
                            {isImproving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            Improve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowImproveInput(false)
                              setImproveFeedback("")
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRegenerate}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                  {hasChanges && coverLetter.id && (
                    <Button
                      className="flex-1"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Tips Card */}
            <div className="rounded-xl bg-primary p-6 text-primary-foreground shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <h3 className="text-lg font-bold">Pro Tips</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Target className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Include specific keywords from the job description
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Highlight your most relevant achievements</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Keep it concise - 300-400 words is ideal</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Use the AI Improve feature to refine your letter
                  </span>
                </li>
              </ul>
            </div>

            {/* Stats Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-foreground">
                Generation Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Position
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {jobApp.jobTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Company
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {jobApp.company}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      Letters for this job
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {previousLetters.length}
                  </span>
                </div>
                {coverLetter && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Word count
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {wordCount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Navigation */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-foreground">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push("/dashboard/letters")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  All Cover Letters
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/jobs/${jobId}`)}
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Job Application
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push("/dashboard/jobs")}
                >
                  <Building className="mr-2 h-4 w-4" />
                  All Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
