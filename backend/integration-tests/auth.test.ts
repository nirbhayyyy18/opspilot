import { afterAll, describe, expect, it } from "vitest"
import request from "supertest"
import app from "../src/app"
import { db } from "../src/prisma/db"

function getSessionCookieHeader(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const raw = headers["set-cookie"]

  const cookies = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? [raw]
      : []

  return cookies.find((cookie) =>
    cookie.startsWith("opspilot_session="),
  )
}

const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const testEmail = `integration-${uniqueId}@example.com`
const testPassword = "IntegrationTest123!"
const allowedOrigin = "http://localhost:3000"

let createdUserId: number | undefined
let createdOrganizationId: number | undefined

describe("Authentication API integration", () => {
  it("supports registration, login, session verification, CSRF protection and logout", async () => {
    const registration = await request(app)
      .post("/api/auth/register")
      .set("Origin", allowedOrigin)
      .send({
        organizationName: `Integration Org ${uniqueId}`,
        email: testEmail,
        password: testPassword,
        firstName: "Integration",
        lastName: "Tester",
      })

    expect(registration.status).toBe(201)
    expect(registration.body.success).toBe(true)
    expect(registration.body.data.user.role).toBe("ORG_ADMIN")
    expect(registration.body.data.user.email).toBe(testEmail)
    expect(registration.body.data.token).toBeUndefined()
    expect(registration.body.data.user.passwordHash).toBeUndefined()

    const registrationCookie = getSessionCookieHeader(registration.headers)

    expect(registrationCookie).toBeDefined()
    expect(registrationCookie).toContain("HttpOnly")
    expect(registrationCookie).toContain("SameSite=Lax")

    createdUserId = registration.body.data.user.userId
    createdOrganizationId = registration.body.data.organization.id

    const login = await request(app)
      .post("/api/auth/login")
      .set("Origin", allowedOrigin)
      .send({
        email: testEmail,
        password: testPassword,
      })

    expect(login.status).toBe(200)
    expect(login.body.success).toBe(true)
    expect(login.body.data.user.email).toBe(testEmail)
    expect(login.body.data.user.role).toBe("ORG_ADMIN")
    expect(login.body.data.user.organizationId).toBe(createdOrganizationId)
    expect(login.body.data.token).toBeUndefined()
    expect(login.body.data.user.passwordHash).toBeUndefined()

    const loginCookie = getSessionCookieHeader(login.headers)

    expect(loginCookie).toBeDefined()
    expect(loginCookie).toContain("HttpOnly")

    const sessionCookie = loginCookie!.split(";")[0]

    const session = await request(app)
      .get("/api/auth/me")
      .set("Cookie", sessionCookie)

    expect(session.status).toBe(200)
    expect(session.body.success).toBe(true)
    expect(session.body.data.user.userId).toBe(createdUserId)
    expect(session.body.data.user.organizationId).toBe(createdOrganizationId)

    const invalidOriginLogout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", sessionCookie)
      .set("Origin", "https://malicious.example")

    expect(invalidOriginLogout.status).toBe(403)

    const logout = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", sessionCookie)
      .set("Origin", allowedOrigin)

    expect(logout.status).toBe(200)
    expect(logout.body.success).toBe(true)

    const clearedCookie = getSessionCookieHeader(logout.headers)

    expect(clearedCookie).toBeDefined()
    expect(clearedCookie).toContain("Expires=")

    const sessionAfterLogout = await request(app)
      .get("/api/auth/me")

    expect(sessionAfterLogout.status).toBe(401)
  })

  it("rejects login requests from an untrusted browser origin", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://malicious.example")
      .send({
        email: testEmail,
        password: testPassword,
      })

    expect(response.status).toBe(403)
    expect(response.body.success).toBe(false)
  })
})

afterAll(async () => {
  try {
    if (createdUserId !== undefined && createdOrganizationId !== undefined) {
      await db.orm.public.Membership
        .where({
          userId: createdUserId,
          organizationId: createdOrganizationId,
        })
        .delete()

      await db.orm.public.User
        .where({ id: createdUserId })
        .delete()

      await db.orm.public.Organization
        .where({ id: createdOrganizationId })
        .delete()
    }
  } finally {
    await db.close()
  }
})
