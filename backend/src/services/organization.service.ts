import { db } from "../prisma/db"
import { hashPassword } from "../utils/password"

interface CreateMemberInput {
  organizationId: number
  email: string
  password: string
  firstName: string
  lastName?: string | undefined
  role: "MANAGER" | "EMPLOYEE" | "VIEWER"
}

export async function createOrganizationMember(
  input: CreateMemberInput,
) {
  const email = input.email.trim().toLowerCase()

  const existingUser = await db.orm.public.User
    .where({ email })
    .select("id")
    .first()

  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  const organization = await db.orm.public.Organization
    .where({ id: input.organizationId })
    .select("id", "name", "status")
    .first()

  if (!organization) {
    throw new Error("Organization not found")
  }

  if (organization.status !== "ACTIVE") {
    throw new Error("Organization is not active")
  }

  const passwordHash = await hashPassword(input.password)

  const result = await db.transaction(async (tx) => {
    const user = await tx.orm.public.User.create({
      email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || null,
    })

    const membership = await tx.orm.public.Membership.create({
      userId: user.id,
      organizationId: input.organizationId,
      role: input.role,
      status: "ACTIVE",
    })

    return {
      user,
      membership,
    }
  })

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      isActive: result.user.isActive,
    },
    organization: {
      id: organization.id,
      name: organization.name,
    },
    role: result.membership.role,
  }
}