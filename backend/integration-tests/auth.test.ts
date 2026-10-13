import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/prisma/db";

const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const testEmail = `integration-${uniqueId}@example.com`;
const testPassword = "IntegrationTest123!";

let createdUserId: number | undefined;
let createdOrganizationId: number | undefined;

describe("Authentication API integration", () => {
  it("registers a user and logs them in against the test database", async () => {
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        organizationName: `Integration Org ${uniqueId}`,
        email: testEmail,
        password: testPassword,
        firstName: "Integration",
        lastName: "Tester",
      });

    expect(registration.status).toBe(201);
    expect(registration.body.success).toBe(true);
    expect(registration.body.data.token).toEqual(expect.any(String));
    expect(registration.body.data.role).toBe("ORG_ADMIN");

    createdUserId = registration.body.data.user.id;
    createdOrganizationId = registration.body.data.organization.id;

    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    expect(login.body.data.token).toEqual(expect.any(String));
    expect(login.body.data.user.email).toBe(testEmail);
    expect(login.body.data.organizationId).toBe(createdOrganizationId);
  });
});

afterAll(async () => {
  try {
    if (createdUserId !== undefined && createdOrganizationId !== undefined) {
      await db.orm.public.Membership
        .where({
          userId: createdUserId,
          organizationId: createdOrganizationId,
        })
        .delete();

      await db.orm.public.User
        .where({ id: createdUserId })
        .delete();

      await db.orm.public.Organization
        .where({ id: createdOrganizationId })
        .delete();
    }
  } finally {
    await db.close();
  }
});