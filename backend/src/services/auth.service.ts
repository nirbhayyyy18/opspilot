import { db } from "../prisma/db"
import { hashPassword, comparePassword } from "../utils/password"
import { generateToken } from "../utils/jwt"

interface RegisterInput {
  organizationName: string
  email: string
  password: string
  firstName: string
  lastName?: string | undefined
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase()

  const existingUser = await db.orm.public.User
    .where((user) => user.email.eq(email))
    .select("id")
    .first()

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  const passwordHash = await hashPassword(input.password)

  const result = await db.transaction(async (tx) => {
    const organization = await tx.orm.public.Organization
      .create({
        name: input.organizationName.trim(),
        slug: createSlug(input.organizationName),
      })


    const user = await tx.orm.public.User
      .create({
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName?.trim() || null,
      })


    const membership = await tx.orm.public.Membership
      .create({
        userId: user.id,
        organizationId: organization.id,
        role: "ORG_ADMIN",
        status: "ACTIVE",
      })


    return {
      organization,
      user,
      membership,
    }
  })

  const token = generateToken({
    userId: result.user.id,
    organizationId: result.organization.id,
    role: result.membership.role,
  })

  return {
    token,
    user: result.user,
    organization: result.organization,
    role: result.membership.role,
  }
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await db.orm.public.User
    .where((user) => user.email.eq(normalizedEmail))
    .select(
      "id",
      "email",
      "passwordHash",
      "firstName",
      "lastName",
      "isActive",
    )
    .first()

  if (!user) {
    throw new Error("Invalid email or password")
  }

  if (!user.isActive) {
    throw new Error("User account is inactive")
  }

  const passwordValid = await comparePassword(
    password,
    user.passwordHash,
  )

  if (!passwordValid) {
    throw new Error("Invalid email or password")
  }

  const membership = await db.orm.public.Membership
    .where((membership) => membership.userId.eq(user.id))
    .select(
      "organizationId",
      "role",
      "status",
    )
    .first()

  if (!membership || membership.status !== "ACTIVE") {
    throw new Error("Active organization membership not found")
  }

  const token = generateToken({
    userId: user.id,
    organizationId: membership.organizationId,
    role: membership.role,
  })

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    organizationId: membership.organizationId,
    role: membership.role,
  }
}

function createSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${baseSlug || "organization"}-${Date.now()}`
}