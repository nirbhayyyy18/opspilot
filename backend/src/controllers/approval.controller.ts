import { Response } from "express"
import { z } from "zod"
import { AuthenticatedRequest } from "../middleware/auth.middleware"
import { createApprovalRequest, processApprovalAction, listApprovalRequests, getApprovalRequest } from "../services/approval.service"

const createApprovalRequestSchema = z.object({
  workflowId: z.number().int().positive(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
})

export async function create(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    const input = createApprovalRequestSchema.parse(req.body)

    const request = await createApprovalRequest({
      organizationId: req.user.organizationId,
      requestedBy: req.user.userId,
      ...input,
    })

    return res.status(201).json({
      success: true,
      message: "Approval request created successfully",
      data: request,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Workflow not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Workflow is not active"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Workflow has no approval steps"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Create approval request error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const processApprovalActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().max(1000).optional(),
})

export async function processAction(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    const approvalRequestId = Number(req.params.id)

    if (
      !Number.isInteger(approvalRequestId) ||
      approvalRequestId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval request ID",
      })
    }

    const input = processApprovalActionSchema.parse(req.body)

    const result = await processApprovalAction({
      approvalRequestId,
      organizationId: req.user.organizationId,
      userId: req.user.userId,
      role: req.user.role as
        | "SUPER_ADMIN"
        | "ORG_ADMIN"
        | "MANAGER"
        | "EMPLOYEE"
        | "VIEWER",
      action: input.action,
      comment: input.comment,
    })

    return res.status(200).json({
      success: true,
      message:
        input.action === "APPROVE"
          ? "Approval request approved successfully"
          : "Approval request rejected successfully",
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Invalid approval request ID"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Approval request not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Approval request is not pending"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Current workflow step not found"
    ) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message ===
        "You are not authorized to approve this request"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Process approval action error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const listApprovalRequestsSchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
    .optional(),
})

export async function list(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    const input = listApprovalRequestsSchema.parse(req.query)

    const requests = await listApprovalRequests({
      organizationId: req.user.organizationId,
      status: input.status,
    })

    return res.status(200).json({
      success: true,
      message: "Approval requests fetched successfully",
      data: requests,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      })
    }

    console.error("List approval requests error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    const approvalRequestId = Number(req.params.id)

    if (
      !Number.isInteger(approvalRequestId) ||
      approvalRequestId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval request ID",
      })
    }

    const result = await getApprovalRequest({
      approvalRequestId,
      organizationId: req.user.organizationId,
    })

    return res.status(200).json({
      success: true,
      message: "Approval request fetched successfully",
      data: result,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Invalid approval request ID"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Approval request not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Get approval request error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}