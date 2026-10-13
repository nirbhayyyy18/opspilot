import { Response } from "express"
import { z } from "zod"
import { AuthenticatedRequest } from "../middleware/auth.middleware"
import {
  createSupplier,
  listSuppliers,
  getSupplier,
  updateSupplier,
} from "../services/supplier.service"

const createSupplierSchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().min(2).max(40),
  email: z.string().trim().email().max(254).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9A-Z]{15}$/i, "GSTIN must contain 15 alphanumeric characters")
    .optional(),
  address: z.string().trim().max(1000).optional(),
})

const listSuppliersQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

const updateSupplierSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
  phone: z.string().trim().min(7).max(20).nullable().optional(),
  gstin: z
    .string()
    .trim()
    .regex(/^[0-9A-Z]{15}$/i, "GSTIN must contain 15 alphanumeric characters")
    .nullable()
    .optional(),
  address: z.string().trim().max(1000).nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
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

    const input = createSupplierSchema.parse(req.body)

    const supplier = await createSupplier({
      organizationId: req.user.organizationId,
      ...input,
    })

    return res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
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

      if (error.message === "Supplier code already exists") {
        return res.status(409).json({
          success: false,
          message: error.message,
        })
      }
    }

    console.error("Create supplier error:", error)

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

    const filters = listSuppliersQuerySchema.parse(req.query)

    const suppliers = await listSuppliers({
      organizationId: req.user.organizationId,
      status: filters.status,
    })

    return res.status(200).json({
      success: true,
      message: "Suppliers retrieved successfully",
      data: suppliers,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.issues,
      })
    }

    console.error("List suppliers error:", error)

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

    const supplierId = Number(req.params.id)

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      })
    }

    const supplier = await getSupplier({
      supplierId,
      organizationId: req.user.organizationId,
    })

    return res.status(200).json({
      success: true,
      message: "Supplier retrieved successfully",
      data: supplier,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Supplier not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Get supplier error:", error)

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

    const supplierId = Number(req.params.id)

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      })
    }

    const input = updateSupplierSchema.parse(req.body)

    const supplier = await updateSupplier({
      supplierId,
      organizationId: req.user.organizationId,
      ...input,
    })

    return res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
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
      if (error.message === "Supplier not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        })
      }

      if (error.message === "No fields to update") {
        return res.status(400).json({
          success: false,
          message: error.message,
        })
      }
    }

    console.error("Update supplier error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}
