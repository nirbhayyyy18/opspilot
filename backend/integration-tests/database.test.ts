import { afterAll, describe, expect, it } from "vitest";
import { db } from "../src/prisma/db";

const testSlug = `integration-test-${Date.now()}`;

describe("Database integration tests", () => {
  it("creates, reads, updates, and deletes a test organization", async () => {
    let organizationId: number | undefined;

    try {
      // CREATE
      const created = await db.orm.public.Organization.create({
        name: "Integration Test Organization",
        slug: testSlug,
      });

      organizationId = created.id;

      expect(created.id).toEqual(expect.any(Number));
      expect(created.slug).toBe(testSlug);

      // READ
      const found = await db.orm.public.Organization
        .where({ id: created.id })
        .select("id", "name", "slug", "status")
        .first();

      expect(found).toBeDefined();
      expect(found?.name).toBe("Integration Test Organization");
      expect(found?.status).toBe("ACTIVE");

      // UPDATE
      await db.orm.public.Organization
        .where({ id: created.id })
        .update({ name: "Updated Integration Test Organization" });

      const updated = await db.orm.public.Organization
        .where({ id: created.id })
        .select("id", "name", "slug")
        .first();

      expect(updated?.name).toBe("Updated Integration Test Organization");

      // DELETE
      await db.orm.public.Organization
        .where({ id: created.id })
        .delete();

      organizationId = undefined;

      const deleted = await db.orm.public.Organization
        .where({ id: created.id })
        .select("id")
        .first();

      expect(deleted).toBeNull();
    } finally {
      // Cleanup only the organization created by this test.
      if (organizationId !== undefined) {
        await db.orm.public.Organization
          .where({ id: organizationId })
          .delete();
      }
    }
  });
});

it("isolates tasks between two organizations", async () => {
  let organizationAId: number | undefined;
  let organizationBId: number | undefined;

  try {
    const organizationA = await db.orm.public.Organization.create({
      name: "Tenant Isolation A",
      slug: `tenant-isolation-a-${Date.now()}`,
    });
    organizationAId = organizationA.id;

    const organizationB = await db.orm.public.Organization.create({
      name: "Tenant Isolation B",
      slug: `tenant-isolation-b-${Date.now()}`,
    });
    organizationBId = organizationB.id;

    const taskA = await db.orm.public.Task.create({
      organizationId: organizationA.id,
      title: "Task belonging to tenant A",
    });

    const taskB = await db.orm.public.Task.create({
      organizationId: organizationB.id,
      title: "Task belonging to tenant B",
    });

    const tasksForA = await db.orm.public.Task
      .where({ organizationId: organizationA.id })
      .select("id", "title", "organizationId")
      .all();

    const tasksForB = await db.orm.public.Task
      .where({ organizationId: organizationB.id })
      .select("id", "title", "organizationId")
      .all();

    expect(tasksForA.map((task) => task.id)).toContain(taskA.id);
    expect(tasksForA.map((task) => task.id)).not.toContain(taskB.id);

    expect(tasksForB.map((task) => task.id)).toContain(taskB.id);
    expect(tasksForB.map((task) => task.id)).not.toContain(taskA.id);

    expect(tasksForA.every(
      (task) => task.organizationId === organizationA.id,
    )).toBe(true);

    expect(tasksForB.every(
      (task) => task.organizationId === organizationB.id,
    )).toBe(true);
  } finally {
    if (organizationAId !== undefined) {
      await db.orm.public.Task
        .where({ organizationId: organizationAId })
        .delete();

      await db.orm.public.Organization
        .where({ id: organizationAId })
        .delete();
    }

    if (organizationBId !== undefined) {
      await db.orm.public.Task
        .where({ organizationId: organizationBId })
        .delete();

      await db.orm.public.Organization
        .where({ id: organizationBId })
        .delete();
    }
  }
});

afterAll(async () => {
  await db.close();
});
