import { Request, Response } from "express"
import { z } from "zod"
import { loginUser, registerUser } from "../services/auth.service"

const registerSchema = z.object({
  organizationName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().max(50).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function register(req: Request, res: Response) {
  try {
    const input = registerSchema.parse(req.body)

    const result = await registerUser(input)

    return res.status(201).json({
      success: true,
      message: "Registration successful",
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

    console.error("Register error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const input = loginSchema.parse(req.body)

    const result = await loginUser(input.email, input.password)

    return res.status(200).json({
      success: true,
      message: "Login successful",
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
      (
        error.message === "Invalid email or password" ||
        error.message === "User account is inactive" ||
        error.message === "Active organization membership not found"
      )
    ) {
      return res.status(401).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Login error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}