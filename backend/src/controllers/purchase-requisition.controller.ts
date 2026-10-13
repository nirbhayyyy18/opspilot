import { Response } from "express"
import { z } from "zod"
import { AuthenticatedRequest } from "../middleware/auth.middleware"
import {
  createPurchaseRequisition,
  listPurchaseRequisitions,
  getPurchaseRequisition,
  updatePurchaseRequisition,
  submitPurchaseRequisition,
} from "../services/purchase-requisition.service"

const createPurchaseRequisitionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  reason: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        itemName: z.string().trim().min(1).max(200),
        description: z.string().trim().max(1000).optional(),
        quantity: z.number().finite().positive(),
        unit: z.string().trim().min(1).max(30),
        estimatedUnitPrice: z.number().finite().nonnegative(),
      }),
    )
    .min(1)
    .max(100),
})

const listPurchaseRequisitionsQuerySchema = z.object({
  status: z
    .enum(["DRAFT", "PENDING", "APPROVED", "REJECTED", "CANCELLED"])
    .optional(),
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

    const input = createPurchaseRequisitionSchema.parse(req.body)

    const requisition = await createPurchaseRequisition({
      organizationId: req.user.organizationId,
      requestedBy: req.user.userId,
      ...input,
    })

    return res.status(201).json({
      success: true,
      message: "Purchase requisition created successfully",
      data: requisition,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      })
    }

    if (error instanceof Error) {
      if (error.message === "Organization not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }

      if (error.message === "Organization is not active") {
        return res.status(403).json({
          success: false,
          message: error.message,
        })
      }

      if (
        error.message === "Requisition title is required" ||
        error.message === "At least one item is required" ||
        error.message === "Item name is required" ||
        error.message === "Item quantity must be greater than zero" ||
        error.message === "Estimated unit price cannot be negative" ||
        error.message === "Item unit is required"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    }

    console.error("Create purchase requisition error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

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

    const filters = listPurchaseRequisitionsQuerySchema.parse(req.query)

    const requisitions = await listPurchaseRequisitions({
      organizationId: req.user.organizationId,
      status: filters.status,
    })

    return res.status(200).json({
      success: true,
      message: "Purchase requisitions retrieved successfully",
      data: requisitions,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.issues,
      })
    }

    console.error("List purchase requisitions error:", error)

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

    const requisitionId = Number(req.params.id)

    if (!Number.isInteger(requisitionId) || requisitionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase requisition ID",
      })
    }

    const requisition = await getPurchaseRequisition({
      requisitionId,
      organizationId: req.user.organizationId,
    })

    return res.status(200).json({
      success: true,
      message: "Purchase requisition retrieved successfully",
      data: requisition,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Purchase requisition not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Get purchase requisition error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export async function updateById(
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

    const requisitionId = Number(req.params.id)

    if (!Number.isInteger(requisitionId) || requisitionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase requisition ID",
      })
    }

    const schema = z.object({
      title: z.string().trim().min(3).max(200).optional(),
      reason: z.string().trim().max(2000).nullable().optional(),
      items: z
        .array(
          z.object({
            itemName: z.string().trim().min(1).max(200),
            description: z.string().trim().max(1000).optional(),
            quantity: z.number().finite().positive(),
            unit: z.string().trim().min(1).max(30),
            estimatedUnitPrice: z.number().finite().nonnegative(),
          }),
        )
        .min(1)
        .max(100)
        .optional(),
    })

    const input = schema.parse(req.body)

    const result = await updatePurchaseRequisition({
      requisitionId,
      organizationId: req.user.organizationId,
      requestedBy: req.user.userId,
      ...input,
    })

    return res.status(200).json({
      success: true,
      message: result.message,
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

    if (error instanceof Error) {
      if (error.message === "Purchase requisition not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }

      if (
        error.message === "You can only edit your own requisitions"
      ) {
        return res.status(403).json({
          success: false,
          message: error.message,
        })
      }

      if (
        error.message === "Only draft requisitions can be edited"
      ) {
        return res.status(409).json({
          success: false,
          message: error.message,
        })
      }

      if (
        error.message === "No fields to update" ||
        error.message === "Requisition title is required" ||
        error.message === "At least one item is required" ||
        error.message === "Item name is required" ||
        error.message === "Item quantity must be greater than zero" ||
        error.message === "Estimated unit price cannot be negative" ||
        error.message === "Item unit is required"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    }

    console.error("Update purchase requisition error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export async function submitForApproval(
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

    const requisitionId = Number(req.params.id)

    if (!Number.isInteger(requisitionId) || requisitionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase requisition ID",
      })
    }

    const schema = z.object({
      workflowId: z.number().int().positive(),
    })

    const { workflowId } = schema.parse(req.body)

    const result = await submitPurchaseRequisition({
      requisitionId,
      organizationId: req.user.organizationId,
      requestedBy: req.user.userId,
      workflowId,
    })

    return res.status(200).json({
      success: true,
      message: result.message,
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

    if (error instanceof Error) {
      const statusCodes: Record<string, number> = {
        "Purchase requisition not found": 404,
        "You can only submit your own requisitions": 403,
        "Only draft requisitions can be submitted": 409,
        "Purchase requisition has already been submitted": 409,
        "At least one item is required": 400,
        "Workflow not found": 404,
        "Workflow is not active": 409,
        "Workflow has no approval steps": 409,
      }

      const statusCode = statusCodes[error.message]

      if (statusCode) {
        return res.status(statusCode).json({
          success: false,
          message: error.message,
        })
      }
    }

    console.error("Submit purchase requisition error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}