import { afterEach, describe, expect, it, vi } from "vitest"
import request from "supertest"

vi.mock("../src/services/task.service", () => ({
  createTask: vi.fn(),
  listTasks: vi.fn(),
  getTask: vi.fn(),
  updateTask: vi.fn(),
}))

vi.mock("../src/middleware/auth.middleware", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/middleware/auth.middleware")>()

  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      const organizationId = Number(req.headers["x-test-organization-id"])
      const userId = 101

      if (!organizationId) {
        return next()
      }

      req.user = {
        userId,
        organizationId,
        role: "MANAGER",
      }

      next()
    },
  }
})

import app from "../src/app"
import { getTask, listTasks, updateTask } from "../src/services/task.service"

afterEach(() => {
  vi.resetAllMocks()
})

describe("Task tenant isolation", () => {
  it("scopes task listing to the authenticated organization", async () => {
    vi.mocked(listTasks).mockResolvedValue([])

    await request(app)
      .get("/api/tasks")
      .set("x-test-organization-id", "2")
      .expect(200)

    expect(listTasks).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 2 }),
    )
  })

  it("returns 404 when a task is not found in the current organization", async () => {
    vi.mocked(getTask).mockRejectedValue(new Error("Task not found"))

    const response = await request(app)
      .get("/api/tasks/1")
      .set("x-test-organization-id", "99")
      .expect(404)

    expect(response.body).toMatchObject({
      success: false,
      message: "Task not found",
    })

    expect(getTask).toHaveBeenCalledWith({
      taskId: 1,
      organizationId: 99,
    })
  })

  it("does not update a task outside the current organization", async () => {
    vi.mocked(updateTask).mockRejectedValue(new Error("Task not found"))

    const response = await request(app)
      .patch("/api/tasks/1")
      .set("x-test-organization-id", "99")
      .send({ title: "Unauthorized change" })
      .expect(404)

    expect(response.body.message).toBe("Task not found")

    expect(updateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 1,
        organizationId: 99,
        title: "Unauthorized change",
      }),
    )
  })
})