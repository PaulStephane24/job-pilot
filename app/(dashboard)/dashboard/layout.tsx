"use client"

import { useState, useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Briefcase,
  FileText,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Jobs", href: "/dashboard/jobs", icon: Briefcase },
  { label: "Cover Letters", href: "/dashboard/letters", icon: FileText },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setSidebarOpen(false)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? "")
    })
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const getPageTitle = () => {
    const match = navItems
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0]
    return match?.label ?? "Dashboard"
  }

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-card transition-all duration-200",
          collapsed ? "w-16" : "w-60",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {!collapsed && (
            <Link href="/dashboard" className="text-lg font-bold text-primary">
              JobPilot
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:block"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-2">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Sign out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-3">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-200",
          collapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
          <div className="ml-auto flex items-center gap-2">
            {userEmail && (
              <span className="hidden text-sm text-muted-foreground md:block">
                {userEmail}
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
