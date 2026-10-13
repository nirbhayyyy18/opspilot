import { db } from "../prisma/db"

export async function getCurrentUser(
  userId: number,
  organizationId: number,
) {
  const user = await db.orm.public.User
    .where((user) => user.id.eq(userId))
    .select(
      "id",
      "email",
      "firstName",
      "lastName",
      "isActive",
    )
    .first()

  if (!user || !user.isActive) {
    throw new Error("User not found")
  }

  const membership = await db.orm.public.Membership
  .where({
    userId,
    organizationId,
  })
    .select(
      "organizationId",
      "role",
      "status",
    )
    .first()

  if (!membership || membership.status !== "ACTIVE") {
    throw new Error("Active organization membership not found")
  }

  const organization = await db.orm.public.Organization
    .where((organization) =>
      organization.id.eq(organizationId),
    )
    .select(
      "id",
      "name",
      "slug",
      "status",
    )
    .first()

  if (!organization) {
    throw new Error("Organization not found")
  }

  return {
    user,
    organization,
    role: membership.role,
  }
}