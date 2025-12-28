"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Code2, Shield, Check, Star } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export default function HomePage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleCheckout = async (planName: string, amount: number, credits: number) => {
    setLoadingPlan(planName)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, credits, planName }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Cillad: " + data.error)
      }
    } catch (err) {
      alert("Cillad ayaa dhacday")
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      name: "Lite",
      price: "£5",
      amount: 500, // pence for stripe
      credits: 500,
      description: "Ideal for trying out our AI",
      popular: false,
    },
    {
      name: "Pro",
      price: "£15",
      amount: 1500,
      credits: 2000,
      description: "Best for active developers",
      popular: true,
    },
    {
      name: "Business",
      price: "£30",
      amount: 3000,
      credits: 5000,
      description: "For agencies and power users",
      popular: false,
    },
  ]

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
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
          <div className="flex justify-center mb-8">
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
                Generate complete components and applications in seconds
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Clean Code</h3>
              <p className="text-sm text-muted-foreground">
                Well-structured, maintainable code following best practices
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-left">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">Encryption and data protection by default</p>
            </div>
          </div>
        </div>

        {/* Pricing Section - NEW */}
        <div id="pricing" className="w-full max-w-5xl mx-auto py-20 border-t">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Affordable Pricing</h2>
            <p className="text-muted-foreground">Buy credits and start building your next big thing.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-8 bg-card rounded-3xl border transition-all hover:shadow-lg ${
                  plan.popular ? "border-primary shadow-md scale-105" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> MOST POPULAR
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/once</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <strong>{plan.credits.toLocaleString()} Credits</strong>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    Unlimited Project History
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    High-End AI Models
                  </li>
                </ul>

                <Button
                  onClick={() => handleCheckout(plan.name, plan.amount, plan.credits)}
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full rounded py-5 font-bold"
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.name ? "Processing..." : `Get ${plan.name}`}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t py-12 bg-slate-50">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Devy AI. All rights reserved.
        </div>
      </footer>
    </div>
  )
}