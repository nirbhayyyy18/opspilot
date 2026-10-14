import { apiRequest } from "@/lib/api"
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  SessionResponse,
} from "@/lib/auth/types"

export async function login(input: LoginInput) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function register(input: RegisterInput) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function getSession() {
  return apiRequest<SessionResponse>("/auth/me")
}

export async function logout() {
  return apiRequest<null>("/auth/logout", {
    method: "POST",
  })
}
