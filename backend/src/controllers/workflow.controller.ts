import { Response } from "express"
import { z } from "zod"
import { AuthenticatedRequest } from "../middleware/auth.middleware"
import { createWorkflow, createWorkflowStep } from "../services/workflow.service"

const createWorkflowSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
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

    const input = createWorkflowSchema.parse(req.body)

    const workflow = await createWorkflow({
      organizationId: req.user.organizationId,
      ...input,
    })

    return res.status(201).json({
      success: true,
      message: "Workflow created successfully",
      data: workflow,
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
      error.message === "Organization not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Organization is not active"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Create workflow error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const createWorkflowStepSchema = z.object({
  stepOrder: z.number().int().min(1),
  name: z.string().min(2).max(100),
  approverRole: z.enum([
    "SUPER_ADMIN",
    "ORG_ADMIN",
    "MANAGER",
  ]),
})

export async function createStep(
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

    const workflowId = Number(req.params.workflowId)

    if (!Number.isInteger(workflowId) || workflowId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid workflow ID",
      })
    }

    const input = createWorkflowStepSchema.parse(req.body)

    const step = await createWorkflowStep({
      workflowId,
      organizationId: req.user.organizationId,
      ...input,
    })

    return res.status(201).json({
      success: true,
      message: "Workflow step created successfully",
      data: step,
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
      error.message === "Invalid workflow ID"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
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
      error.message ===
        "Workflow step with this order already exists"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Create workflow step error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}