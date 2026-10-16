"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  ChevronDown,
  Package,
  Plus,
  ShoppingCart,
  Users,
  X,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError } from "@/lib/api"
import {
  createTask,
  getTasks,
  updateTaskStatus,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/task-api"

const priorities: {
  value: TaskPriority
  label: string
}[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
]

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return "Your session has expired. Please sign in again."
    }

    if (err.status === 403) {
      return "You do not have permission to create tasks."
    }

    return err.message
  }

  return err instanceof Error
    ? err.message
    : "Something went wrong. Please try again."
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [dueDate, setDueDate] = useState("")

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getTasks()
      setTasks(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchInitialTasks() {
      try {
        const data = await getTasks()

        if (!cancelled) {
          setTasks(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchInitialTasks()

    return () => {
      cancelled = true
    }
  }, [])

  const handleCreateTask = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTitle) {
      setCreateError("Please enter a task title.")
      return
    }

    if (trimmedTitle.length > 200) {
      setCreateError("Task title must be 200 characters or fewer.")
      return
    }

    if (trimmedDescription.length > 2000) {
      setCreateError("Description must be 2000 characters or fewer.")
      return
    }

    setCreating(true)
    setCreateError(null)
    setSuccessMessage(null)

    try {
      await createTask({
        title: trimmedTitle,
        ...(trimmedDescription
          ? { description: trimmedDescription }
          : {}),
        priority,
        ...(dueDate
          ? { dueDate: new Date(`${dueDate}T00:00:00`).toISOString() }
          : {}),
      })

      setTitle("")
      setDescription("")
      setPriority("MEDIUM")
      setDueDate("")
      setShowCreateForm(false)
      setSuccessMessage("Task created successfully.")

      await loadTasks()
    } catch (err) {
      setCreateError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const openTasks = tasks.filter(
    (task) =>
      task.status === "TODO" || task.status === "IN_PROGRESS",
  ).length

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS",
  ).length

  const completedTasks = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO",
  ).length

  const cancelledTasks = tasks.filter(
    (task) => task.status === "CANCELLED",
  ).length

  const stats = [
    {
      title: "Open Tasks",
      value: openTasks,
      description: "To do or in progress",
      icon: ClipboardCheck,
    },
    {
      title: "In Progress",
      value: inProgressTasks,
      description: "Currently being worked on",
      icon: Clock3,
    },
    {
      title: "Completed Tasks",
      value: completedTasks,
      description: "Successfully completed",
      icon: CheckCircle2,
    },
    {
      title: "Total Tasks",
      value: tasks.length,
      description: "Across your organization",
      icon: Activity,
    },
  ]

  const handleStatusChange = async (
    taskId: number,
    status: TaskStatus,
  ) => {
    setUpdatingTaskId(taskId)
    setStatusError(null)
    setSuccessMessage(null)

    try {
      await updateTaskStatus(taskId, status)
      await loadTasks()
      setSuccessMessage("Task status updated succesfully.")
    } catch (err) {
      setStatusError(getErrorMessage(err))
    } finally {
      setUpdatingTaskId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Overview</p>

          <h1 className="text-2xl font-semibold tracking-tight">
            Operations Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your organization&apos;s operations and activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            title="Reports are not connected yet"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium opacity-60"
          >
            <BarChart3 className="size-4" />
            View Reports
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current)
              setCreateError(null)
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {showCreateForm ? (
              <X className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {showCreateForm ? "Close Form" : "Create Task"}
          </button>

          <button
            type="button"
            onClick={() => void loadTasks()}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Activity className="size-4" />
            {loading ? "Loading..." : "Refresh Tasks"}
          </button>
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create a New Task</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add a task to your organization&apos;s operations.
            </p>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleCreateTask}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="task-title"
                  className="text-sm font-medium"
                >
                  Task Title <span className="text-destructive">*</span>
                </label>

                <input
                  id="task-title"
                  name="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  required
                  autoFocus
                  placeholder="e.g. Review pending purchase requests"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                <p className="text-right text-xs text-muted-foreground">
                  {title.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="task-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="task-description"
                  name="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Add details about this task (optional)"
                  className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                <p className="text-right text-xs text-muted-foreground">
                  {description.length}/2000
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="task-priority"
                    className="text-sm font-medium"
                  >
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    name="priority"
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.target.value as TaskPriority)
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {priorities.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="task-due-date"
                    className="text-sm font-medium"
                  >
                    Due Date <span className="text-muted-foreground">(optional)</span>
                  </label>

                  <input
                    id="task-due-date"
                    name="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {createError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {createError}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateError(null)
                  }}
                  className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-green-600/30 bg-green-600/5 p-3 text-sm"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage(null)}
            className="rounded p-1 hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {statusError && (
        <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {statusError}
        </div>
      )}

      {/* Task Loading Error */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-destructive/40 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-destructive">{error}</p>

          <button
            type="button"
            onClick={() => void loadTasks()}
            disabled={loading}
            className="text-sm font-medium underline underline-offset-4 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}

      {/* Live Task Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {loading ? "—" : stat.value.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Tasks and Summary */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Tasks</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest tasks from your organization.
                </p>
              </div>

              <Activity className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading tasks...
              </p>
            ) : error ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tasks could not be displayed.
              </p>
            ) : tasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No tasks yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create your first task to see it here.
                </p>

                {!showCreateForm && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="size-4" />
                    Create your first task
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {task.title}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {task.description || "No description"}
                      </p>

                      {task.dueDate && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>


                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <div className="relative">
                        <select
                          aria-label={`Update status for ${task.title}`}
                          value={task.status}
                          disabled={updatingTaskId === task.id}
                          onChange={(event) =>
                            void handleStatusChange(
                              task.id,
                              event.target.value as TaskStatus,
                            )
                          }
                          className="h-9 appearance-none rounded-md border bg-background py-1 pl-3 pr-8 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        {updatingTaskId === task.id ? (
                          <Loader2 className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin" />
                        ) : (
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2" />
                        )}
                      </div>

                      <span className="rounded-md border px-2 py-1 text-xs">
                        {task.priority}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {[
              { label: "To Do", count: todoTasks },
              { label: "In Progress", count: inProgressTasks },
              { label: "Completed", count: completedTasks },
              { label: "Cancelled", count: cancelledTasks },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>

                <span className="text-sm font-semibold">
                  {loading ? "—" : item.count}
                </span>
              </div>
            ))}

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">
                Counts are calculated from tasks returned by your API.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {[
              { title: "Purchase Requests", icon: ShoppingCart },
              { title: "Task Management", icon: ClipboardCheck },
              { title: "Inventory", icon: Package },
              { title: "Suppliers", icon: Users },
            ].map((action) => {
              const Icon = action.icon

              return (
                <div
                  key={action.title}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4" />
                    </div>

                    <span className="text-sm font-medium">
                      {action.title}
                    </span>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Data</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg border border-dashed p-6 text-center">
              <AlertTriangle className="mx-auto size-7 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">
                More integrations pending
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Inventory, purchase approvals, and recent activity will be
                connected after their APIs are verified.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}