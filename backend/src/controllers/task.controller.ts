import { Response } from "express"
import { z } from "zod"
import { AuthenticatedRequest } from "../middleware/auth.middleware"
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
} from "../services/task.service"

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .default("MEDIUM"),
  dueDate: z.string().datetime().optional(),
})

const listTasksQuerySchema = z.object({
  status: z
    .enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
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

    const input = createTaskSchema.parse(req.body)

    const task = await createTask({
      organizationId: req.user.organizationId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
    })

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
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

    console.error("Create task error:", error)

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

    const filters = listTasksQuerySchema.parse(req.query)

    const tasks = await listTasks({
      organizationId: req.user.organizationId,
      status: filters.status,
      priority: filters.priority,
    })

    return res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: error.issues,
      })
    }

    console.error("List tasks error:", error)

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

    const taskId = Number(req.params.id)

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      })
    }

    const task = await getTask({
      taskId,
      organizationId: req.user.organizationId,
    })

    return res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      data: task,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Task not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Get task error:", error)

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

    const taskId = Number(req.params.id)

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      })
    }

    const updateSchema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      status: z
        .enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
        .optional(),
      priority: z
        .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
        .optional(),
      dueDate: z.string().datetime().nullable().optional(),
    })

    const input = updateSchema.parse(req.body)

    const task = await updateTask({
      taskId,
      organizationId: req.user.organizationId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      dueDate: input.dueDate,
    })

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
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
      error.message === "Invalid task ID"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "Task not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      })
    }

    if (
      error instanceof Error &&
      error.message === "No fields to update"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      })
    }

    console.error("Update task error:", error)

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}