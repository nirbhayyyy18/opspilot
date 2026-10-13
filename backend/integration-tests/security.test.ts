import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/prisma/db";

describe("API security integration tests", () => {
  it("rejects requests to protected task endpoints without a token", async () => {
    const endpoints = [
      { method: "get" as const, path: "/api/tasks" },
      { method: "get" as const, path: "/api/tasks/1" },
      { method: "post" as const, path: "/api/tasks" },
      { method: "patch" as const, path: "/api/tasks/1" },
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)[endpoint.method](endpoint.path);

      expect(
        response.status,
        `${endpoint.method.toUpperCase()} ${endpoint.path} should reject unauthenticated requests`,
      ).toBe(401);
    }
  });
});

afterAll(async () => {
  await db.close();
});