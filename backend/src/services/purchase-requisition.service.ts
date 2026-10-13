import { db } from "../prisma/db"

interface PurchaseRequisitionItemInput {
  itemName: string
  description?: string | undefined
  quantity: number
  unit: string
  estimatedUnitPrice: number
}

interface CreatePurchaseRequisitionInput {
  organizationId: number
  requestedBy: number
  title: string
  reason?: string | undefined
  items: PurchaseRequisitionItemInput[]
}

interface ListPurchaseRequisitionsInput {
  organizationId: number
  status:
    | "DRAFT"
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | undefined
}

export async function createPurchaseRequisition(
  input: CreatePurchaseRequisitionInput,
) {
  const title = input.title.trim()
  const reason = input.reason?.trim() || null

  if (!title) {
    throw new Error("Requisition title is required")
  }

  if (input.items.length === 0) {
    throw new Error("At least one item is required")
  }

  for (const item of input.items) {
    if (!item.itemName.trim()) {
      throw new Error("Item name is required")
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error("Item quantity must be greater than zero")
    }

    if (!Number.isFinite(item.estimatedUnitPrice) || item.estimatedUnitPrice < 0) {
      throw new Error("Estimated unit price cannot be negative")
    }

    if (!item.unit.trim()) {
      throw new Error("Item unit is required")
    }
  }

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

  const requisitionNumber = `PR-${input.organizationId}-${Date.now()}`

  return db.transaction(async (tx) => {
    const requisition = await tx.orm.public.PurchaseRequisition.create({
      organizationId: input.organizationId,
      requestedBy: input.requestedBy,
      requisitionNumber,
      title,
      reason,
      status: "DRAFT",
    })

    const items = await Promise.all(
      input.items.map((item) =>
        tx.orm.public.PurchaseRequisitionItem.create({
          purchaseRequisitionId: requisition.id,
          itemName: item.itemName.trim(),
          description: item.description?.trim() || null,
          quantity: item.quantity,
          unit: item.unit.trim(),
          estimatedUnitPrice: item.estimatedUnitPrice,
        }),
      ),
    )

    return {
      ...requisition,
      items,
    }
  })
}

export async function listPurchaseRequisitions(
  input: ListPurchaseRequisitionsInput,
) {
  const filters = input.status
    ? {
        organizationId: input.organizationId,
        status: input.status,
      }
    : {
        organizationId: input.organizationId,
      }

  const requisitions = await db.orm.public.PurchaseRequisition
    .where(filters)
    .select(
      "id",
      "organizationId",
      "requestedBy",
      "requisitionNumber",
      "title",
      "reason",
      "status",
      "approvalRequestId",
      "createdAt",
      "updatedAt",
    )
    .orderBy((requisition) => requisition.createdAt.desc())
    .all()

  return requisitions
}

export async function getPurchaseRequisition(input: {
  requisitionId: number
  organizationId: number
}) {
  const requisition = await db.orm.public.PurchaseRequisition
    .where({
      id: input.requisitionId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "organizationId",
      "requestedBy",
      "requisitionNumber",
      "title",
      "reason",
      "status",
      "approvalRequestId",
      "createdAt",
      "updatedAt",
    )
    .first()

  if (!requisition) {
    throw new Error("Purchase requisition not found")
  }

  const items = await db.orm.public.PurchaseRequisitionItem
    .where({
      purchaseRequisitionId: requisition.id,
    })
    .select(
      "id",
      "purchaseRequisitionId",
      "itemName",
      "description",
      "quantity",
      "unit",
      "estimatedUnitPrice",
      "createdAt",
      "updatedAt",
    )
    .all()

  return {
    ...requisition,
    items,
    estimatedTotal: items.reduce(
      (total, item) => total + item.quantity * item.estimatedUnitPrice,
      0,
    ),
  }
}

interface UpdatePurchaseRequisitionInput {
  requisitionId: number
  organizationId: number
  requestedBy: number
  title?: string | undefined
  reason?: string | null | undefined
  items?: PurchaseRequisitionItemInput[] | undefined
}

export async function updatePurchaseRequisition(
  input: UpdatePurchaseRequisitionInput,
) {
  const existing = await db.orm.public.PurchaseRequisition
    .where({
      id: input.requisitionId,
      organizationId: input.organizationId,
    })
    .select("id", "requestedBy", "status")
    .first()

  if (!existing) {
    throw new Error("Purchase requisition not found")
  }

  if (existing.requestedBy !== input.requestedBy) {
    throw new Error("You can only edit your own requisitions")
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Only draft requisitions can be edited")
  }

  if (
    input.title === undefined &&
    input.reason === undefined &&
    input.items === undefined
  ) {
    throw new Error("No fields to update")
  }

  if (input.title !== undefined && !input.title.trim()) {
    throw new Error("Requisition title is required")
  }

  if (input.items !== undefined) {
    if (input.items.length === 0) {
      throw new Error("At least one item is required")
    }

    for (const item of input.items) {
      if (!item.itemName.trim()) {
        throw new Error("Item name is required")
      }

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error("Item quantity must be greater than zero")
      }

      if (
        !Number.isFinite(item.estimatedUnitPrice) ||
        item.estimatedUnitPrice < 0
      ) {
        throw new Error("Estimated unit price cannot be negative")
      }

      if (!item.unit.trim()) {
        throw new Error("Item unit is required")
      }
    }
  }

  return db.transaction(async (tx) => {
    const updateData = {
      ...(input.title !== undefined && {
        title: input.title.trim(),
      }),
      ...(input.reason !== undefined && {
        reason: input.reason?.trim() || null,
      }),
    }

    if (Object.keys(updateData).length > 0) {
      await tx.orm.public.PurchaseRequisition
        .where({
          id: input.requisitionId,
          organizationId: input.organizationId,
        })
        .update(updateData)
    }

    if (input.items !== undefined) {
      await tx.orm.public.PurchaseRequisitionItem
        .where({
          purchaseRequisitionId: input.requisitionId,
        })
        .delete()

      await Promise.all(
        input.items.map((item) =>
          tx.orm.public.PurchaseRequisitionItem.create({
            purchaseRequisitionId: input.requisitionId,
            itemName: item.itemName.trim(),
            description: item.description?.trim() || null,
            quantity: item.quantity,
            unit: item.unit.trim(),
            estimatedUnitPrice: item.estimatedUnitPrice,
          }),
        ),
      )
    }

    return {
      message: "Purchase requisition updated successfully",
      requisitionId: input.requisitionId,
    }
  })
}

interface SubmitPurchaseRequisitionInput {
  requisitionId: number
  organizationId: number
  requestedBy: number
  workflowId: number
}

export async function submitPurchaseRequisition(
  input: SubmitPurchaseRequisitionInput,
) {
  const requisition = await db.orm.public.PurchaseRequisition
    .where({
      id: input.requisitionId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "organizationId",
      "requestedBy",
      "requisitionNumber",
      "title",
      "reason",
      "status",
      "approvalRequestId",
    )
    .first()

  if (!requisition) {
    throw new Error("Purchase requisition not found")
  }

  if (requisition.requestedBy !== input.requestedBy) {
    throw new Error("You can only submit your own requisitions")
  }

  if (requisition.status !== "DRAFT") {
    throw new Error("Only draft requisitions can be submitted")
  }

  if (requisition.approvalRequestId !== null) {
    throw new Error("Purchase requisition has already been submitted")
  }

  const items = await db.orm.public.PurchaseRequisitionItem
    .where({
      purchaseRequisitionId: requisition.id,
    })
    .select("id")
    .all()

  if (items.length === 0) {
    throw new Error("At least one item is required")
  }

  const workflow = await db.orm.public.Workflow
    .where({
      id: input.workflowId,
      organizationId: input.organizationId,
    })
    .select("id", "isActive")
    .first()

  if (!workflow) {
    throw new Error("Workflow not found")
  }

  if (!workflow.isActive) {
    throw new Error("Workflow is not active")
  }

  const firstStep = await db.orm.public.WorkflowStep
    .where({
      workflowId: input.workflowId,
      stepOrder: 1,
    })
    .select("id")
    .first()

  if (!firstStep) {
    throw new Error("Workflow has no approval steps")
  }

  const result = await db.transaction(async (tx) => {
    const approvalRequest = await tx.orm.public.ApprovalRequest.create({
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      requestedBy: input.requestedBy,
      currentStep: 1,
      status: "PENDING",
      title: requisition.title,
      description: [
        `Purchase Requisition: ${requisition.requisitionNumber}`,
        requisition.reason?.trim() || "",
      ]
        .filter(Boolean)
        .join("\n"),
    })

    await tx.orm.public.PurchaseRequisition
      .where({
        id: requisition.id,
        organizationId: input.organizationId,
      })
      .update({
        status: "PENDING",
        approvalRequestId: approvalRequest.id,
      })

    return {
      approvalRequest,
      requisitionId: requisition.id,
      requisitionNumber: requisition.requisitionNumber,
    }
  })

  return {
    message: "Purchase requisition submitted for approval successfully",
    ...result,
  }
}