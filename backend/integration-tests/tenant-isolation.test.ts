import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/prisma/db";

const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const organizations = [
  {
    name: `Tenant A ${uniqueId}`,
    email: `tenant-a-${uniqueId}@example.com`,
  },
  {
    name: `Tenant B ${uniqueId}`,
    email: `tenant-b-${uniqueId}@example.com`,
  },
];

const password = "TenantTestPassword123!";

let organizationIdA: number | undefined;
let organizationIdB: number | undefined;
let taskIdA: number | undefined;
let taskIdB: number | undefined;

describe("Multi-tenant API isolation", () => {
  it("prevents one organization from accessing another organization's tasks", async () => {
    // Register two independent organizations.
    const registrationA = await request(app)
      .post("/api/auth/register")
      .set("Origin", "http://localhost:3000")
      .send({
        organizationName: organizations[0].name,
        email: organizations[0].email,
        password,
        firstName: "Tenant",
        lastName: "A",
      });

    expect(registrationA.status).toBe(201);
    expect(registrationA.body.data.token).toBeUndefined();
    organizationIdA = registrationA.body.data.organization.id;

    const registrationB = await request(app)
      .post("/api/auth/register")
      .set("Origin", "http://localhost:3000")
      .send({
        organizationName: organizations[1].name,
        email: organizations[1].email,
        password,
        firstName: "Tenant",
        lastName: "B",
      });

    expect(registrationB.status).toBe(201);
    expect(registrationB.body.data.token).toBeUndefined();
    organizationIdB = registrationB.body.data.organization.id;

    // Extract session cookies from registration responses.
    const cookieA = registrationA.headers["set-cookie"];
    const cookieB = registrationB.headers["set-cookie"];

    const sessionCookieA = (Array.isArray(cookieA) ? cookieA : [cookieA])
      .find((cookie) => cookie?.startsWith("opspilot_session="))
      ?.split(";")[0];

    const sessionCookieB = (Array.isArray(cookieB) ? cookieB : [cookieB])
      .find((cookie) => cookie?.startsWith("opspilot_session="))
      ?.split(";")[0];

    expect(sessionCookieA).toBeDefined();
    expect(sessionCookieB).toBeDefined();

    expect(organizationIdA).not.toBe(organizationIdB);

    // Create a task in Tenant A.
    const taskA = await request(app)
      .post("/api/tasks")
      .set("Cookie", sessionCookieA!)
      .set("Origin", "http://localhost:3000")
      .send({
        title: `Private task A ${uniqueId}`,
        priority: "HIGH",
      });

    expect(taskA.status).toBe(201);
    taskIdA = taskA.body.data.id;
    expect(taskA.body.data.organizationId).toBe(organizationIdA);

    // Create a task in Tenant B.
    const taskB = await request(app)
      .post("/api/tasks")
      .set("Cookie", sessionCookieB!)
      .set("Origin", "http://localhost:3000")
      .send({
        title: `Private task B ${uniqueId}`,
        priority: "MEDIUM",
      });

    expect(taskB.status).toBe(201);
    taskIdB = taskB.body.data.id;
    expect(taskB.body.data.organizationId).toBe(organizationIdB);

    // Tenant A must only see its own task.
    const listA = await request(app)
      .get("/api/tasks")
      .set("Cookie", sessionCookieA!);

    expect(listA.status).toBe(200);
    expect(
      listA.body.data.some((task: { id: number }) => task.id === taskIdA),
    ).toBe(true);
    expect(
      listA.body.data.some((task: { id: number }) => task.id === taskIdB),
    ).toBe(false);

    // Tenant A must not fetch Tenant B's task.
    const crossTenantRead = await request(app)
      .get(`/api/tasks/${taskIdB}`)
      .set("Cookie", sessionCookieA!);

    expect(crossTenantRead.status).toBe(404);
    expect(crossTenantRead.body.message).toBe("Task not found");

    // Tenant A must not modify Tenant B's task.
    const crossTenantUpdate = await request(app)
      .patch(`/api/tasks/${taskIdB}`)
      .set("Cookie", sessionCookieA!)
      .set("Origin", "http://localhost:3000")
      .send({
        title: "Unauthorized modification",
      });

    expect(crossTenantUpdate.status).toBe(404);
    expect(crossTenantUpdate.body.message).toBe("Task not found");

    // Tenant B's original task must remain unchanged.
    const taskBAfterAttempt = await request(app)
      .get(`/api/tasks/${taskIdB}`)
      .set("Cookie", sessionCookieB!);

    expect(taskBAfterAttempt.status).toBe(200);
    expect(taskBAfterAttempt.body.data.title).toBe(
      `Private task B ${uniqueId}`,
    );
  });
});

afterAll(async () => {
  try {
    // Delete tasks before deleting their organizations.
    if (organizationIdA !== undefined) {
      await db.orm.public.Task
        .where({ organizationId: organizationIdA })
        .delete();
    }

    if (organizationIdB !== undefined) {
      await db.orm.public.Task
        .where({ organizationId: organizationIdB })
        .delete();
    }

    // Remove memberships, users without other memberships, and organizations.
    for (const organizationId of [
      organizationIdA,
      organizationIdB,
    ]) {
      if (organizationId === undefined) continue;

      const organization = await db.orm.public.Organization
        .where({ id: organizationId })
        .select("id")
        .first();

      if (!organization) continue;

      const memberships = await db.orm.public.Membership
        .where({ organizationId })
        .select("userId")
        .all();

      await db.orm.public.Membership
        .where({ organizationId })
        .delete();

      for (const membership of memberships) {
        const otherMemberships = await db.orm.public.Membership
          .where({ userId: membership.userId })
          .select("organizationId")
          .all();

        if (otherMemberships.length === 0) {
          await db.orm.public.User
            .where({ id: membership.userId })
            .delete();
        }
      }

      await db.orm.public.Organization
        .where({ id: organizationId })
        .delete();
    }
  } finally {
    await db.close();
  }
});