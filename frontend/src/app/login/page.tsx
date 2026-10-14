"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import { ArrowRight, Boxes, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react"

export default function LoginPage() {
  const { login, user, loading: sessionLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.")
      return
    }

    if (!password) {
      setError("Please enter your password.")
      return
    }

    setSubmitting(true)

    try {
      await login({ email: normalizedEmail, password })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Check that the API server is running and try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (sessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </main>
    )
  }

  if (user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Opening your workspace...</p>
      </main>
    )
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-blue-500/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-zinc-950">
            <Boxes className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">OpsPilot</span>
        </Link>

        <div className="relative max-w-xl py-12">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.24em] text-indigo-300">
            Operations, under control
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Your business operations.
            <span className="mt-2 block text-zinc-400">
              One clear view.
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
            Bring tasks, approvals, purchasing and inventory together in one
            workspace built to keep your team moving.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ["Tasks", "Stay aligned"],
              ["Approvals", "Move faster"],
              ["Inventory", "Track stock"],
            ].map(([title, subtitle]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-500">
          A unified workspace for everyday operations.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-12 flex items-center gap-2 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </span>
            <span className="text-lg font-semibold">OpsPilot</span>
          </Link>

          <div className="mb-8">
            <p className="text-sm font-medium text-muted-foreground">WELCOME BACK</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Sign in to OpsPilot
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Enter your work account details to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Work email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 rounded-xl pl-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
              </div>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 rounded-xl pl-10 pr-11"
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl text-sm font-medium"
            >
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting && <ArrowRight className="ml-2 size-4" />}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            New to OpsPilot?{" "}
            <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>

          <p className="mt-10 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to use your organization&apos;s workspace
            responsibly.
          </p>
        </div>
      </section>
    </main>
  )
}
