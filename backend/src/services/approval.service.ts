import { db } from "../prisma/db"

interface CreateApprovalRequestInput {
  organizationId: number
  workflowId: number
  requestedBy: number
  title: string
  description?: string | undefined
}

export async function createApprovalRequest(
  input: CreateApprovalRequestInput,
) {
  const workflow = await db.orm.public.Workflow
    .where({
      id: input.workflowId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "organizationId",
      "isActive",
    )
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

  const request = await db.orm.public.ApprovalRequest.create({
    organizationId: input.organizationId,
    workflowId: input.workflowId,
    requestedBy: input.requestedBy,
    currentStep: 1,
    status: "PENDING",
    title: input.title.trim(),
    description: input.description?.trim() || null,
  })

  return request
}

interface ProcessApprovalActionInput {
  approvalRequestId: number
  organizationId: number
  userId: number
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "EMPLOYEE" | "VIEWER"
  action: "APPROVE" | "REJECT"
  comment?: string | undefined
}

export async function processApprovalAction(
  input: ProcessApprovalActionInput,
) {
  const request = await db.orm.public.ApprovalRequest
    .where({
      id: input.approvalRequestId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "workflowId",
      "organizationId",
      "currentStep",
      "status",
    )
    .first()

  if (!request) {
    throw new Error("Approval request not found")
  }

  if (request.status !== "PENDING") {
    throw new Error("Approval request is not pending")
  }

  const currentStep = await db.orm.public.WorkflowStep
    .where({
      workflowId: request.workflowId,
      stepOrder: request.currentStep,
    })
    .select(
      "id",
      "stepOrder",
      "approverRole",
    )
    .first()

  if (!currentStep) {
    throw new Error("Current workflow step not found")
  }

  if (currentStep.approverRole !== input.role) {
    throw new Error("You are not authorized to approve this request")
  }

  const result = await db.transaction(async (tx) => {
    const approvalAction = await tx.orm.public.ApprovalAction.create({
      approvalRequestId: request.id,
      actedBy: input.userId,
      action: input.action,
      comment: input.comment?.trim() || null,
    })

    if (input.action === "REJECT") {
      const updated = await tx.orm.public.ApprovalRequest
        .where({
          id: request.id,
          organizationId: input.organizationId,
        })
        .update({
          status: "REJECTED",
        })

      await tx.orm.public.PurchaseRequisition
        .where({
          approvalRequestId: request.id,
          organizationId: input.organizationId,
        })
        .update({
          status: "REJECTED",
        })

      return {
        approvalAction,
        request: updated,
      }
    }

    const nextStep = await tx.orm.public.WorkflowStep
      .where({
        workflowId: request.workflowId,
        stepOrder: request.currentStep + 1,
      })
      .select("id")
      .first()

    if (nextStep) {
      const updated = await tx.orm.public.ApprovalRequest
        .where({
          id: request.id,
          organizationId: input.organizationId,
        })
        .update({
          currentStep: request.currentStep + 1,
        })

      return {
        approvalAction,
        request: updated,
      }
    }

    const updated = await tx.orm.public.ApprovalRequest
      .where({
        id: request.id,
        organizationId: input.organizationId,
      })
      .update({
        status: "APPROVED",
      })

    await tx.orm.public.PurchaseRequisition
      .where({
        approvalRequestId: request.id,
        organizationId: input.organizationId,
      })
      .update({
        status: "APPROVED"
      })

    return {
      approvalAction,
      request: updated,
    }
  })

  return result
}

interface ListApprovalRequestsInput {
  organizationId: number
  status?:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | undefined
}

export async function listApprovalRequests(
  input: ListApprovalRequestsInput,
) {
  const filters: {
    organizationId: number
    status?: ListApprovalRequestsInput["status"]
  } = {
    organizationId: input.organizationId,
  }

  if (input.status) {
    filters.status = input.status
  }

  const requests = await db.orm.public.ApprovalRequest
    .where(filters)
    .select(
      "id",
      "organizationId",
      "workflowId",
      "requestedBy",
      "currentStep",
      "status",
      "title",
      "description",
      "createdAt",
      "updatedAt",
    )
    .orderBy((request) => request.createdAt.desc())
    .all()

  return requests
}

interface GetApprovalRequestInput {
  approvalRequestId: number
  organizationId: number
}

export async function getApprovalRequest(
  input: GetApprovalRequestInput,
) {
  const request = await db.orm.public.ApprovalRequest
    .where({
      id: input.approvalRequestId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "organizationId",
      "workflowId",
      "requestedBy",
      "currentStep",
      "status",
      "title",
      "description",
      "createdAt",
      "updatedAt",
    )
    .first()

  if (!request) {
    throw new Error("Approval request not found")
  }

  const actions = await db.orm.public.ApprovalAction
    .where({
      approvalRequestId: input.approvalRequestId,
    })
    .select(
      "id",
      "approvalRequestId",
      "actedBy",
      "action",
      "comment",
      "createdAt",
    )
    .orderBy((action) => action.createdAt.asc())
    .all()

  return {
    request,
    actions,
  }
}