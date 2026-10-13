import jwt from "jsonwebtoken"

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET is not configured")
  }

  return secret
}

export interface JwtPayload {
  userId: number
  organizationId: number
  role: string
}

export function generateToken(payload: JwtPayload): string {
  const secret = getJwtSecret()

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  })
}

export function verifyToken(token: string): JwtPayload {
  const secret = getJwtSecret()
  const decoded = jwt.verify(token, secret)

  if (typeof decoded === "string") {
    throw new Error("Invalid JWT payload")
  }

  if (
    typeof decoded.userId !== "number" ||
    typeof decoded.organizationId !== "number" ||
    typeof decoded.role !== "string"
  ) {
    throw new Error("Invalid JWT payload")
  }

  return {
    userId: decoded.userId,
    organizationId: decoded.organizationId,
    role: decoded.role,
  }
}