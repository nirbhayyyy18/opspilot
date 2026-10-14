"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api"
import {
  ArrowRight,
  Boxes,
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react"

export default function RegisterPage() {
  const { register, user, loading: sessionLoading } = useAuth()
  const [organizationName, setOrganizationName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (organizationName.trim().length < 2) {
      setError("Organization name must contain at least 2 characters.")
      return
    }

    if (!firstName.trim()) {
      setError("Please enter your first name.")
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.")
      return
    }

    if (password.length < 8 || password.length > 100) {
      setError("Password must be between 8 and 100 characters.")
      return
    }

    setSubmitting(true)

    try {
      await register({
        organizationName: organizationName.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password,
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create your workspace. Check that the API server is running and try again.",
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
            Start with a clear view
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Set up your workspace.
            <span className="mt-2 block text-zinc-400">Bring your team together.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
            Organize tasks, purchasing, approvals and inventory in one place
            designed around your organization.
          </p>

          <div className="mt-10 space-y-4">
            {[
              "A dedicated workspace for your organization",
              "Centralized operational workflows",
              "Role-aware access for your team",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="size-1.5 rounded-full bg-indigo-400" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-500">
          Your operations, connected.
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </span>
            <span className="text-lg font-semibold">OpsPilot</span>
          </Link>

          <div className="mb-7">
            <p className="text-sm font-medium text-muted-foreground">GET STARTED</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Create your workspace
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Set up your organization and administrator account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="organizationName" className="text-sm font-medium">
                Organization name
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="organizationName"
                  name="organizationName"
                  autoComplete="organization"
                  placeholder="Acme Operations"
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  className="h-10 rounded-xl pl-10"
                  minLength={2}
                  maxLength={100}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First name
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="First name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="h-10 rounded-xl pl-10"
                    maxLength={50}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  Last name <span className="text-muted-foreground">(optional)</span>
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="h-10 rounded-xl"
                  maxLength={50}
                  disabled={submitting}
                />
              </div>
            </div>

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
                  className="h-10 rounded-xl pl-10"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-10 rounded-xl pl-10 pr-11"
                  minLength={8}
                  maxLength={100}
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
              <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-xl text-sm font-medium"
            >
              {submitting ? "Creating workspace..." : "Create workspace"}
              {!submitting && <ArrowRight className="ml-2 size-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
