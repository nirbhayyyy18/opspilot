import { describe, expect, it } from "vitest"
import request from "supertest"
import app from "../src/app"

describe("GET /api/health", () => {
  it("returns a successful health response", async () => {
    const response = await request(app)
      .get("/api/health")
      .expect("Content-Type", /json/)
      .expect(200)

    expect(response.body).toMatchObject({
      success: true,
      message: "OpsPilot API is running",
    })

    expect(response.body.timestamp).toBeTypeOf("string")
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false)
  })
})