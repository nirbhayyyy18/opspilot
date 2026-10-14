"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "@/lib/auth/auth-api"
import type {
  AuthUser,
  LoginInput,
  Organization,
  RegisterInput,
} from "@/lib/auth/types"

interface AuthContextValue {
  user: AuthUser | null
  organization: Organization | null
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshSession = useCallback(async () => {
    try {
      const response = await getSession()
      setUser(response.data.user)
      setOrganization(response.data.organization)
    } catch {
      setUser(null)
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        const response = await getSession()

        if (active) {
          setUser(response.data.user)
          setOrganization(response.data.organization)
        }
      } catch {
        if (active) {
          setUser(null)
          setOrganization(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    await loginRequest(input)
    const session = await getSession()

    setUser(session.data.user)
    setOrganization(session.data.organization)

    router.replace("/dashboard")
    router.refresh()
  }, [router])

  const register = useCallback(async (input: RegisterInput) => {
    await registerRequest(input)
    const session = await getSession()

    setUser(session.data.user)
    setOrganization(session.data.organization)

    router.replace("/dashboard")
    router.refresh()
  }, [router])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
      setOrganization(null)
      router.replace("/login")
      router.refresh()
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        login,
        register,
        logout,
        refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return context
}
