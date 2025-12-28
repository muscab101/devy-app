"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/dropdown-menu" // Hubi in path-kan uu sax yahay (caadiyan waa @/components/ui/dropdown-menu)
import { History, LogOut, Settings, UserIcon, Shield, Coins } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu"

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      const { data } = await supabase
        .from("users")
        .select("is_admin, credits")
        .eq("id", user.id)
        .single()
      
      setIsAdmin(data?.is_admin || false)
      setCredits(data?.credits || 0)
    }

    fetchData()

    // DHAGEYSO ISBEDELKA REAL-TIME
    const channel = supabase
      .channel(`user-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // Marka database-ka laga bedelo credits-ka, halkan ayuu real-time uga soo muuqanayaa
          setCredits(payload.new.credits)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  // Function-kan ayaa maqnaa:
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh() // Tani waxay hubinaysaa in session-ka la tirtiro
  }

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-6">
        <Link href="/generate" className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="Devy Logo" width={120} height={40} className="h-8 w-auto" priority />
        </Link>

        <nav className="ml-auto flex items-center gap-4">
          {credits !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <Coins className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">{credits.toLocaleString()}</span>
            </div>
          )}

          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
          </Button>

          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <History className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}