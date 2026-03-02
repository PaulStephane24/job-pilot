"use client"

import {
  Briefcase,
  FileText,
  PhoneCall,
  Gift,
  XCircle,
  Heart,
  ArrowRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardStats {
  total: number
  applied: number
  interviewing: number
  offered: number
  rejected: number
  wishlist: number
  coverLetters: number
}

export function DashboardContent({
  firstName,
  stats,
}: {
  firstName: string
  stats: DashboardStats
}) {
  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Applied",
      value: stats.applied,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Interviewing",
      value: stats.interviewing,
      icon: PhoneCall,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Offers",
      value: stats.offered,
      icon: Gift,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Wishlist",
      value: stats.wishlist,
      icon: Heart,
      color: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-500/10",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {firstName}
        </h2>
        <p className="mt-1 text-muted-foreground">
          {"Here's an overview of your job search progress."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col items-center pt-6 text-center">
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Track a New Job</CardTitle>
            <CardDescription>
              Add a job application to your tracker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/jobs">
                Go to Jobs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Cover Letter</CardTitle>
            <CardDescription>
              Create an AI-powered cover letter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/letters">
                Go to Letters <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Update Your Profile</CardTitle>
            <CardDescription>
              Upload resume & complete your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/profile">
                Go to Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cover letters stat */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Cover Letters</p>
              <p className="text-sm text-muted-foreground">
                {stats.coverLetters} generated so far
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/letters">View all</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
