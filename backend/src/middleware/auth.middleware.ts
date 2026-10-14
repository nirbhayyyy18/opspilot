import type { NextFunction, Request, Response } from "express"
import { verifyToken, type JwtPayload } from "../utils/jwt"
import { AUTH_COOKIE_NAME } from "../utils/auth-cookie"

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

    // Preserve existing Bearer-token authentication.
    const bearerToken =
      authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : undefined

    // Fall back to the HttpOnly session cookie.
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME] as
      | string
      | undefined

    const token = bearerToken || cookieToken

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    req.user = verifyToken(token)

    return next()
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}