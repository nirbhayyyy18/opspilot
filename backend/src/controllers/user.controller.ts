import { Response } from "express"
import {
  AuthenticatedRequest,
} from "../middleware/auth.middleware"
import { getCurrentUser } from "../services/user.service"

export async function getMe(
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

    const result = await getCurrentUser(
      req.user.userId,
      req.user.organizationId,
    )

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: result,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "User not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message ===
        "Active organization membership not found"
    ) {
      return res.status(403).json({
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

    console.error("Get current user error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}