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

let tokenA: string | undefined;
let tokenB: string | undefined;
let organizationIdA: number | undefined;
let organizationIdB: number | undefined;
let taskIdA: number | undefined;
let taskIdB: number | undefined;

describe("Multi-tenant API isolation", () => {
  it("prevents one organization from accessing another organization's tasks", async () => {
    // Register two independent organizations.
    const registrationA = await request(app)
      .post("/api/auth/register")
      .send({
        organizationName: organizations[0].name,
        email: organizations[0].email,
        password,
        firstName: "Tenant",
        lastName: "A",
      });

    expect(registrationA.status).toBe(201);
    tokenA = registrationA.body.data.token;
    organizationIdA = registrationA.body.data.organization.id;

    const registrationB = await request(app)
      .post("/api/auth/register")
      .send({
        organizationName: organizations[1].name,
        email: organizations[1].email,
        password,
        firstName: "Tenant",
        lastName: "B",
      });

    expect(registrationB.status).toBe(201);
    tokenB = registrationB.body.data.token;
    organizationIdB = registrationB.body.data.organization.id;

    expect(organizationIdA).not.toBe(organizationIdB);

    // Create a task in each organization.
    const taskA = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: `Private task A ${uniqueId}`,
        priority: "HIGH",
      });

    expect(taskA.status).toBe(201);
    taskIdA = taskA.body.data.id;
    expect(taskA.body.data.organizationId).toBe(organizationIdA);

    const taskB = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        title: `Private task B ${uniqueId}`,
        priority: "MEDIUM",
      });

    expect(taskB.status).toBe(201);
    taskIdB = taskB.body.data.id;
    expect(taskB.body.data.organizationId).toBe(organizationIdB);

    // Tenant A must only see its own task in the list.
    const listA = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(listA.status).toBe(200);
    expect(
      listA.body.data.some((task: { id: number }) => task.id === taskIdA),
    ).toBe(true);
    expect(
      listA.body.data.some((task: { id: number }) => task.id === taskIdB),
    ).toBe(false);

    // Tenant A must not fetch Tenant B's task by ID.
    const crossTenantRead = await request(app)
      .get(`/api/tasks/${taskIdB}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(crossTenantRead.status).toBe(404);
    expect(crossTenantRead.body.message).toBe("Task not found");

    // Tenant A must not modify Tenant B's task.
    const crossTenantUpdate = await request(app)
      .patch(`/api/tasks/${taskIdB}`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        title: "Unauthorized modification",
      });

    expect(crossTenantUpdate.status).toBe(404);
    expect(crossTenantUpdate.body.message).toBe("Task not found");

    // Confirm Tenant B's original task remains unchanged.
    const taskBAfterAttempt = await request(app)
      .get(`/api/tasks/${taskIdB}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(taskBAfterAttempt.status).toBe(200);
    expect(taskBAfterAttempt.body.data.title).toBe(
      `Private task B ${uniqueId}`,
    );
  });
});

afterAll(async () => {
  try {
    // Clean up test tasks before deleting their organizations.
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

    // Remove memberships, users, and organizations created by registration.
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