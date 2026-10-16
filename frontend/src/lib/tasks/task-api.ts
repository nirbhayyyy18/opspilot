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

export async function getTasks(): Promise<Task[]> {
  const response = await apiRequest<Task[]>("/tasks")
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