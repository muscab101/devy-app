import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Code2, Shield } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Devy Logo" width={120} height={40} className="h-8 w-auto" priority />
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-between  mb-8">
            <Image
              src="/images/logo.png"
              alt="Devy - AI Code Generator"
              width={300}
              height={100}
              className="h-20 w-auto"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Code Generation</span>
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
            Generate Production-Ready Code in Seconds
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Transform your ideas into clean, functional code instantly. Our AI understands your requirements and
            generates optimized code tailored to your needs.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Start Generating Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Generate complete components and applications in seconds, not hours
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Clean Code</h3>
              <p className="text-sm text-muted-foreground">
                Get well-structured, maintainable code following best practices
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Your code and data are always encrypted and protected</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
