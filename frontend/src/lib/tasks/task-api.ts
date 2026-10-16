
import { apiRequest } from "@/lib/api"

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT"

export interface Task {
  id: number
  organizationId: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
}

export async function getTasks(
  filters?: TaskFilters,
): Promise<Task[]> {
  const params = new URLSearchParams()

  if (filters?.status) {
    params.set("status", filters.status)
  }

  if (filters?.priority) {
    params.set("priority", filters.priority)
  }

  const query = params.toString()
  const endpoint = query ? `/tasks?${query}` : "/tasks"

  const response = await apiRequest<Task[]>(endpoint)
  return response.data
}

export async function createTask(
  input: CreateTaskInput,
): Promise<Task> {
  const response = await apiRequest<Task>("/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  })

  return response.data
}

export async function updateTaskStatus(
  taskId: number,
  status: TaskStatus,
): Promise<Task> {
  const response = await apiRequest<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  })

  return response.data
}

export async function updateTaskPriority(
  taskId: number,
  priority: TaskPriority,
): Promise<Task> {
  const response = await apiRequest<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ priority }),
  })

  return response.data
}
