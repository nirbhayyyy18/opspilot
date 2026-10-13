import { db } from "../prisma/db"

interface CreateTaskInput {
  organizationId: number
  title: string
  description?: string | undefined
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: string | undefined
}

export async function createTask(input: CreateTaskInput) {
  const organization = await db.orm.public.Organization
    .where({ id: input.organizationId })
    .select("id", "status")
    .first()

  if (!organization) {
    throw new Error("Organization not found")
  }

  if (organization.status !== "ACTIVE") {
    throw new Error("Organization is not active")
  }

  const task = await db.orm.public.Task.create({
    organizationId: input.organizationId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    priority: input.priority,
    dueDate: input.dueDate ?? null,
  })

  return task
}


interface ListTasksInput {
  organizationId: number
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined
}

export async function listTasks(input: ListTasksInput) {
  const filters: {
    organizationId: number
    status?: ListTasksInput["status"]
    priority?: ListTasksInput["priority"]
  } = {
    organizationId: input.organizationId,
  }

  if (input.status) {
    filters.status = input.status
  }

  if (input.priority) {
    filters.priority = input.priority
  }

  const tasks = await db.orm.public.Task
    .where(filters)
    .select(
      "id",
      "organizationId",
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "createdAt",
      "updatedAt",
    )
    .orderBy((task) => task.createdAt.desc())
    .all()

  return tasks
}

interface GetTaskInput {
    taskId: number
    organizationId: number
}

export async function getTask(input: GetTaskInput) {
  const task = await db.orm.public.Task
    .where({
      id: input.taskId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "organizationId",
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "createdAt",
      "updatedAt",
    )
    .first()

  if (!task) {
    throw new Error("Task not found")
  }

  return task
}

interface UpdateTaskInput {
  taskId: number
  organizationId: number
  title?: string | undefined
  description?: string | null | undefined
  status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined
  dueDate?: string | null | undefined
}

export async function updateTask(input: UpdateTaskInput) {
  const existingTask = await db.orm.public.Task
    .where({
      id: input.taskId,
      organizationId: input.organizationId,
    })
    .select("id")
    .first()

  if (!existingTask) {
    throw new Error("Task not found")
  }

  const updates: {
    title?: string
    description?: string | null
    status?: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    dueDate?: string | null
  } = {}

  if (input.title !== undefined) {
    updates.title = input.title.trim()
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null
  }

  if (input.status !== undefined) {
    updates.status = input.status
  }

  if (input.priority !== undefined) {
    updates.priority = input.priority
  }

  if (input.dueDate !== undefined) {
    updates.dueDate = input.dueDate
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No fields to update")
  }

  const plan = db.sql.public.Task
    .update(updates)
    .where((fields, fns) =>
      fns.and(
        fns.eq(fields.id, input.taskId),
        fns.eq(fields.organizationId, input.organizationId),
      ),
    )
    .returning(
      "id",
      "organizationId",
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "createdAt",
      "updatedAt",
    )
    .build()

  const result = await db.runtime().query(plan)

  const task = result[0]

  if (!task) {
    throw new Error("Task not found")
  }

  return task
}