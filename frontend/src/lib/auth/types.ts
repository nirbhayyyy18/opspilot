export type UserRole =
  | "SUPER_ADMIN"
  | "ORG_ADMIN"
  | "MANAGER"
  | "EMPLOYEE"
  | "VIEWER"

export interface AuthUser {
  userId: string | number
  organizationId: string | number
  role: UserRole
  email: string
  firstName: string
  lastName: string | null
}

export interface Organization {
  id: string | number
  name: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  organizationName: string
  email: string
  password: string
  firstName: string
  lastName?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
  organization?: Organization
  organizationId?: string | number
  role: UserRole
}

export interface SessionResponse {
  user: AuthUser
  organization: Organization
}
