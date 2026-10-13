import { Response } from "express"
import { z } from "zod"
import { AuthenticatedRequest } from "../middleware/auth.middleware"
import { createOrganizationMember } from "../services/organization.service"

const createMemberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional(),
  role: z.enum(["MANAGER", "EMPLOYEE", "VIEWER"]),
})

export async function createMember(
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

    const input = createMemberSchema.parse(req.body)

    const result = await createOrganizationMember({
      organizationId: req.user.organizationId,
      ...input,
    })

    return res.status(201).json({
      success: true,
      message: "Organization member created successfully",
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
      error.message === "User with this email already exists"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
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

    console.error("Create member error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}