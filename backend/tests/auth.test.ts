import { afterEach, describe, expect, it, vi } from "vitest"
import request from "supertest"

vi.mock("../src/services/auth.service", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}))

import app from "../src/app"
import { loginUser } from "../src/services/auth.service"

const mockedLoginUser = vi.mocked(loginUser)

afterEach(() => {
  vi.resetAllMocks()
})

describe("POST /api/auth/login", () => {
  it("returns 400 when email is missing", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ password: "StrongPassword123" })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe("Validation failed")
    expect(mockedLoginUser).not.toHaveBeenCalled()
  })

  it("returns 400 when email format is invalid", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "not-an-email",
        password: "StrongPassword123",
      })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe("Validation failed")
    expect(mockedLoginUser).not.toHaveBeenCalled()
  })

  it("returns 401 when credentials are invalid", async () => {
    mockedLoginUser.mockRejectedValue(
      new Error("Invalid email or password"),
    )

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@example.com",
        password: "WrongPassword123",
      })
      .expect(401)

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid email or password",
    })

    expect(mockedLoginUser).toHaveBeenCalledWith(
      "wrong@example.com",
      "WrongPassword123",
    )
  })
})

import { registerUser } from "../src/services/auth.service"

const mockedRegisterUser = vi.mocked(registerUser)

describe("POST /api/auth/register", () => {
  it("returns 400 when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "new@example.com",
        password: "StrongPassword123",
      })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe("Validation failed")
    expect(mockedRegisterUser).not.toHaveBeenCalled()
  })

  it("returns 409 when email already exists", async () => {
    mockedRegisterUser.mockRejectedValue(
      new Error("User with this email already exists"),
    )

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        organizationName: "Nova Steel Test",
        email: "existing@example.com",
        password: "StrongPassword123",
        firstName: "Test",
        lastName: "User",
      })
      .expect(409)

    expect(response.body).toMatchObject({
      success: false,
      message: "User with this email already exists",
    })
  })
})