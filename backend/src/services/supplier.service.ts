import { db } from "../prisma/db"

interface CreateSupplierInput {
  organizationId: number
  name: string
  code: string
  email?: string | undefined
  phone?: string | undefined
  gstin?: string | undefined
  address?: string | undefined
}

interface ListSuppliersInput {
  organizationId: number
  status?: "ACTIVE" | "INACTIVE" | undefined
}

interface UpdateSupplierInput {
  supplierId: number
  organizationId: number
  name?: string | undefined
  email?: string | null | undefined
  phone?: string | null | undefined
  gstin?: string | null | undefined
  address?: string | null | undefined
  status?: "ACTIVE" | "INACTIVE" | undefined
}

export async function createSupplier(input: CreateSupplierInput) {
  const name = input.name.trim()
  const code = input.code.trim().toUpperCase()

  const organization = await db.orm.public.Organization
    .where({ id: input.organizationId })
    .select("id", "status")
    .first()

  if (!organization) {
    throw new Error("Organization not found")
  }

  if (organization.status !== "ACTIVE") {
    throw new Error("Organization is not active")
  }

  const existingSupplier = await db.orm.public.Supplier
    .where({
      organizationId: input.organizationId,
      code,
    })
    .select("id")
    .first()

  if (existingSupplier) {
    throw new Error("Supplier code already exists")
  }

  return db.orm.public.Supplier.create({
    organizationId: input.organizationId,
    name,
    code,
    email: input.email?.trim().toLowerCase() || null,
    phone: input.phone?.trim() || null,
    gstin: input.gstin?.trim().toUpperCase() || null,
    address: input.address?.trim() || null,
  })
}

export async function listSuppliers(input: ListSuppliersInput) {
  const filters = input.status
    ? {
        organizationId: input.organizationId,
        status: input.status,
      }
    : {
        organizationId: input.organizationId,
      }

  return db.orm.public.Supplier
    .where(filters)
    .select(
      "id",
      "name",
      "code",
      "email",
      "phone",
      "gstin",
      "address",
      "status",
      "createdAt",
      "updatedAt",
    )
    .all()
}

export async function getSupplier(input: {
  supplierId: number
  organizationId: number
}) {
  const supplier = await db.orm.public.Supplier
    .where({
      id: input.supplierId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "name",
      "code",
      "email",
      "phone",
      "gstin",
      "address",
      "status",
      "createdAt",
      "updatedAt",
    )
    .first()

  if (!supplier) {
    throw new Error("Supplier not found")
  }

  return supplier
}

export async function updateSupplier(input: UpdateSupplierInput) {
  const { supplierId, organizationId, ...fields } = input

  const existing = await db.orm.public.Supplier
    .where({
      id: supplierId,
      organizationId,
    })
    .select("id")
    .first()

  if (!existing) {
    throw new Error("Supplier not found")
  }

  const data = {
    ...(fields.name !== undefined && { name: fields.name.trim() }),
    ...(fields.email !== undefined && {
      email: fields.email?.trim().toLowerCase() || null,
    }),
    ...(fields.phone !== undefined && {
      phone: fields.phone?.trim() || null,
    }),
    ...(fields.gstin !== undefined && {
      gstin: fields.gstin?.trim().toUpperCase() || null,
    }),
    ...(fields.address !== undefined && {
      address: fields.address?.trim() || null,
    }),
    ...(fields.status !== undefined && { status: fields.status }),
  }

  if (Object.keys(data).length === 0) {
    throw new Error("No fields to update")
  }

  return db.orm.public.Supplier
    .where({
      id: supplierId,
      organizationId,
    })
    .update(data)
}
