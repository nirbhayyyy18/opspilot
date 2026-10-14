import type { NextFunction, Request, Response } from "express"

const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
])

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export function validateBrowserOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.get("Origin")

  // Non-browser clients may not send Origin.
  if (!origin) {
    return next()
  }

  if (!ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    })
  }

  return next()
}

export function protectCookieRequests(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.get("Origin")
  const hasSessionCookie = Boolean(req.cookies?.opspilot_session)

  if (!hasSessionCookie || SAFE_METHODS.has(req.method)) {
    return next()
  }

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({
      success: false,
      message: "Invalid or missing Origin for cookie-authenticated request",
    })
  }

  return next()
}
