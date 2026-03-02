"use client"

import { Button } from "@/components/ui/button"
import { FileText, Briefcase, PenTool } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            JobPilot
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl">
          Land Your Dream Job with{" "}
          <span className="text-primary">AI-Powered Tools</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
          Upload your resume, generate tailored cover letters, and track every
          application from wishlist to offer -- all in one place.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="px-8" asChild>
            <Link href="/signup">Start for Free</Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8" asChild>
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </main>

      {/* Features */}
      <section id="features" className="border-t border-border bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            How JobPilot Works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Upload Your Resume",
                desc: "Upload a PDF or DOCX and we parse your skills, experience, and education automatically.",
              },
              {
                icon: PenTool,
                title: "Generate Cover Letters",
                desc: "AI-powered cover letters tailored to each job description and your profile.",
              },
              {
                icon: Briefcase,
                title: "Track Applications",
                desc: "Manage every application from wishlist to offer with a simple Kanban-style tracker.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 text-card-foreground"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to streamline your job search?</h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty opacity-90">
            Join job seekers who use JobPilot to stay organized and land
            interviews faster.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 px-8"
            asChild
          >
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <p className="text-center text-sm text-muted-foreground">
          {"© "}{new Date().getFullYear()}{" JobPilot. All rights reserved."}
        </p>
      </footer>
    </div>
  )
}
