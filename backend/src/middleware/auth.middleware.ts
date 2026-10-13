import { NextFunction, Request, Response } from "express"
import { verifyToken, JwtPayload } from "../utils/jwt"

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    const token = authHeader.substring(7)

    const payload = verifyToken(token)

    req.user = payload

    next()
  } catch (error) {
    console.error("Authentication error:", error)

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}