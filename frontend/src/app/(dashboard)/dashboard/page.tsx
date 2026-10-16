
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
  updateTask,
  updateTaskStatus,
  updateTaskPriority,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskInput
} from "@/lib/tasks/task-api"

const priorities: { value: TaskPriority; label: string }[] = [
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

function getPriorityClasses(priority: TaskPriority): string {
  switch (priority) {
    case "URGENT":
      return "border-red-500/30 bg-red-500/10 text-red-600"
    case "HIGH":
      return "border-orange-500/30 bg-orange-500/10 text-orange-600"
    case "MEDIUM":
      return "border-blue-500/30 bg-blue-500/10 text-blue-600"
    case "LOW":
      return "border-green-500/30 bg-green-500/10 text-green-600"
  }
}

function isOpenTask(task: Task): boolean {
  return task.status != "COMPLETED" && task.status !== "CANCELLED"
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2,"0")
  const day = String(date.getDate()).padStart(2,"0")

  return `${year}-${month}-${day}`
}

function getTaskDueDateKey(task: Task): string | null {
  if (!task.dueDate) return null
  
  return getLocalDateKey(new Date(task.dueDate))
}

function isTaskOverdue(task: Task, todaykey: string): boolean {
  const dueDateKey = getTaskDueDateKey(task)

  return (
    isOpenTask(task) &&
    dueDateKey !== null &&
    dueDateKey < todaykey
  )
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

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL")
  const [priorityFilter, setPriorityFilter] = useState<
    "ALL" | TaskPriority
  >("ALL")

  const [dueDateFilter, setDueDateFilter] = useState<
    "ALL" | "OVERDUE" | "TODAY" | "UPCOMING" | "NO_DUE_DATE"
  >("ALL")
  const [taskSort, setTaskSort] = useState<
    "NEWEST" | "OLDEST" | "DUE_DATE"
  >("NEWEST")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [dueDate, setDueDate] = useState("")

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM")
  const [editDueDate, setEditDueDate] = useState("")
  const [editError, setEditError] = useState<string | null>(null)

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

  const todayKey = getLocalDateKey(new Date())

  const overdueTasks = tasks.filter((task) =>
    isTaskOverdue(task, todayKey),
  ).length

  const dueTodayTasks = tasks.filter(
    (task) =>
      isOpenTask(task) &&
      getTaskDueDateKey(task) === todayKey,
  ).length

  const upcomingTasks = tasks.filter((task) => {
    const dueDateKey = getTaskDueDateKey(task)

    return (
      isOpenTask(task) &&
      dueDateKey !== null &&
      dueDateKey > todayKey
    )
  }).length

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter

      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter

      const dueDateKey = getTaskDueDateKey(task)

      let matchesDueDate = true

      switch (dueDateFilter) {
        case "OVERDUE":
          matchesDueDate = isTaskOverdue(task, todayKey)
          break
        case "TODAY":
          matchesDueDate = isOpenTask(task) && dueDateKey === todayKey
          break
        case "UPCOMING":
          matchesDueDate = isOpenTask(task) && dueDateKey !== null && dueDateKey > todayKey
          break
        case "NO_DUE_DATE":
          matchesDueDate = dueDateKey === null
          break
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesDueDate
      )
  })
  .sort((a, b) => {
    if (taskSort === "DUE_DATE") {
      const aDate = getTaskDueDateKey(a)
      const bDate = getTaskDueDateKey(b)

      if (aDate === null && bDate === null) return 0
      if (aDate === null) return 1
      if (bDate === null) return -1

      return aDate.localeCompare(bDate)
    }

    const aTime = new Date(a.createdAt).getTime()
    const bTime = new Date(b.createdAt).getTime()

    return taskSort === "NEWEST"
      ? bTime - aTime
      : aTime - bTime
  })

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
      title: "Overdue Tasks",
      value: overdueTasks,
      description: "Open tasks past their deadline",
      icon: AlertTriangle
    },
    {
      title: "Due Today",
      value: dueTodayTasks,
      description: "Open Tasks due today",
      icon: Activity
    },
    {
      title: "Upcoming Tasks",
      value: upcomingTasks,
      description: "Open tasks due after today",
      icon: Clock3
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
      setSuccessMessage("Task status updated successfully.")
    } catch (err) {
      setStatusError(getErrorMessage(err))
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handlePriorityChange = async (
    taskId: number,
    nextPriority: TaskPriority,
  ) => {
    setUpdatingTaskId(taskId)
    setStatusError(null)
    setSuccessMessage(null)

    try {
      await updateTaskPriority(taskId, nextPriority)
      await loadTasks()
      setSuccessMessage("Task priority updated successfully.")
    } catch (err) {
      setStatusError(getErrorMessage(err))
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleEditTask = (task: Task) => {
  setEditingTaskId(task.id)
  setEditTitle(task.title)
  setEditDescription(task.description ?? "")
  setEditPriority(task.priority)
  setEditDueDate(getTaskDueDateKey(task) ?? "")
  setEditError(null)
  setStatusError(null)
  setSuccessMessage(null)
    }

  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditTitle("")
    setEditDescription("")
    setEditPriority("MEDIUM")
    setEditDueDate("")
    setEditError(null)
  }

  const handleSaveEdit = async (
    event: React.FormEvent<HTMLFormElement>,
    taskId: number,
  ) => {
    event.preventDefault()

    const trimmedTitle = editTitle.trim()
    const trimmedDescription = editDescription.trim()

    if (!trimmedTitle) {
      setEditError("Please enter a task title.")
      return
    }

    if (trimmedTitle.length > 200) {
      setEditError("Task title must be 200 characters or fewer.")
      return
    }

    if (trimmedDescription.length > 2000) {
      setEditError("Description must be 2000 characters or fewer.")
      return
    }

    setSavingEdit(true)
    setEditError(null)
    setSuccessMessage(null)
    setStatusError(null)

    const input: UpdateTaskInput = {
      title: trimmedTitle,
      description: trimmedDescription || null,
      priority: editPriority,
      dueDate: editDueDate
        ? new Date(`${editDueDate}T00:00:00`).toISOString()
        : null,
    }

    try {
      await updateTask(taskId, input)
      handleCancelEdit()
      await loadTasks()
      setSuccessMessage("Task updated successfully.")
    } catch (err) {
      setEditError(getErrorMessage(err))
    } finally {
      setSavingEdit(false)
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
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="task-title" className="text-sm font-medium">
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
                    Due Date{" "}
                    <span className="text-muted-foreground">(optional)</span>
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

      {/* Success Message */}
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

      {/* Task Update Error */}
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            {/* Search, Status Filter, and Priority Filter */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative min-w-0 flex-1">
                <input
                  type="search"
                  placeholder="Search tasks by title..."
                  aria-label="Search tasks by title"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <select
                aria-label="Filter tasks by status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "ALL" | TaskStatus)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                aria-label="Filter tasks by priority"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as "ALL" | TaskPriority)
                }
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Priority</option>
              </select>

              <select
                aria-label="Filter tasks by due date"
                value={dueDateFilter}
                onChange={(event) =>
                  setDueDateFilter(
                    event.target.value as
                      | "ALL"
                      | "OVERDUE"
                      | "TODAY"
                      | "UPCOMING"
                      | "NO_DUE_DATE",
                  )
                }
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ALL">All Deadlines</option>
                <option value="OVERDUE">Overdue</option>
                <option value="TODAY">Due Today</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="NO_DUE_DATE">No Due Date</option>
              </select>

              <select
                aria-label="Sort tasks"
                value={taskSort}
                onChange={(event) =>
                  setTaskSort(
                    event.target.value as "NEWEST" | "OLDEST" | "DUE_DATE",
                  )
                }
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="DUE_DATE">Earliest Deadline</option>
              </select>
            </div>

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
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  No matching tasks found
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different title, status, priority, or deadline filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.slice(0, 5).map((task) => (
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
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>

                          {isTaskOverdue(task, todayKey) && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
                              <AlertTriangle className="size-3" />
                              Overdue
                            </span>
                          )}

                          {isOpenTask(task) &&
                            getTaskDueDateKey(task) === todayKey && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                                Due Today
                              </span>
                            )}
                        </div>
                      )}

                      {editingTaskId === task.id && (
                        <form
                          onSubmit={(event) => void handleSaveEdit(event, task.id)}
                          className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4"
                        >
                          <h3 className="text-sm font-semibold">Edit Task</h3>

                          <div className="space-y-1">
                            <label
                              htmlFor={`edit-title-${task.id}`}
                              className="text-xs font-medium"
                            >
                              Task Title
                            </label>

                            <input
                              id={`edit-title-${task.id}`}
                              value={editTitle}
                              onChange={(event) => setEditTitle(event.target.value)}
                              maxLength={200}
                              required
                              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <label
                              htmlFor={`edit-description-${task.id}`}
                              className="text-xs font-medium"
                            >
                              Description
                            </label>

                            <textarea
                              id={`edit-description-${task.id}`}
                              value={editDescription}
                              onChange={(event) => setEditDescription(event.target.value)}
                              maxLength={2000}
                              rows={3}
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            />
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label
                                htmlFor={`edit-priority-${task.id}`}
                                className="text-xs font-medium"
                              >
                                Priority
                              </label>

                              <select
                                id={`edit-priority-${task.id}`}
                                value={editPriority}
                                onChange={(event) =>
                                  setEditPriority(event.target.value as TaskPriority)
                                }
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                              >
                                {priorities.map((item) => (
                                  <option key={item.value} value={item.value}>
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label
                                htmlFor={`edit-due-date-${task.id}`}
                                className="text-xs font-medium"
                              >
                                Due Date
                              </label>

                              <input
                                id={`edit-due-date-${task.id}`}
                                type="date"
                                value={editDueDate}
                                onChange={(event) => setEditDueDate(event.target.value)}
                                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                              />
                            </div>
                          </div>

                          {editError && (
                            <p role="alert" className="text-sm text-destructive">
                              {editError}
                            </p>
                          )}

                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={savingEdit}
                              className="h-9 rounded-md border px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              disabled={savingEdit || !editTitle.trim()}
                              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {savingEdit && (
                                <Loader2 className="size-3.5 animate-spin" />
                              )}
                              {savingEdit ? "Saving..." : "Save Changes"}
                            </button>
                          </div>
                        </form>
                      )}

                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {/* Update Task Status */}
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

                      {/* Update Task Priority */}
                      <select
                        aria-label={`Update priority for ${task.title}`}
                        value={task.priority}
                        disabled={updatingTaskId === task.id}
                        onChange={(event) =>
                          void handlePriorityChange(
                            task.id,
                            event.target.value as TaskPriority,
                          )
                        }
                        className={`h-9 rounded-md border px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 ${getPriorityClasses(task.priority)}`}
                      >
                        {priorities.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleEditTask(task)}
                        disabled={updatingTaskId === task.id || savingEdit}
                        className="h-9 rounded-md border px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Summary */}
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
