import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/supplier.service", () => ({
  createSupplier: vi.fn(),
  listSuppliers: vi.fn(),
  getSupplier: vi.fn(),
  updateSupplier: vi.fn(),
}));

vi.mock("../src/middleware/auth.middleware", () => ({
  authenticate: (
    req: any,
    _res: any,
    next: any,
  ) => {
    req.user = {
      userId: 101,
      organizationId: Number(
        req.headers["x-test-organization-id"] ?? 2,
      ),
      role: String(req.headers["x-test-role"] ?? "ORG_ADMIN"),
    };

    next();
  },
  authorize: (..._roles: string[]) => (
    _req: any,
    _res: any,
    next: any,
  ) => next(),
}));

import app from "../src/app";
import {
  createSupplier,
  listSuppliers,
  getSupplier,
  updateSupplier,
} from "../src/services/supplier.service";

const mockedCreate = vi.mocked(createSupplier);
const mockedList = vi.mocked(listSuppliers);
const mockedGet = vi.mocked(getSupplier);
const mockedUpdate = vi.mocked(updateSupplier);

afterEach(() => {
  vi.resetAllMocks();
});

describe("Supplier API", () => {
  it("rejects creation when the supplier name is missing", async () => {
    const response = await request(app)
      .post("/api/suppliers")
      .send({ code: "SUP-001" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid GSTIN", async () => {
    const response = await request(app)
      .post("/api/suppliers")
      .send({
        name: "Test Supplier",
        code: "SUP-001",
        gstin: "INVALID",
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("creates a supplier in the authenticated organization", async () => {
    mockedCreate.mockResolvedValue({
      id: 10,
      organizationId: 2,
      name: "Test Supplier",
      code: "SUP-001",
      status: "ACTIVE",
    } as never);

    const response = await request(app)
      .post("/api/suppliers")
      .set("x-test-organization-id", "2")
      .send({
        name: "Test Supplier",
        code: "SUP-001",
        email: "supplier@example.com",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(mockedCreate).toHaveBeenCalledWith({
      organizationId: 2,
      name: "Test Supplier",
      code: "SUP-001",
      email: "supplier@example.com",
    });
  });

  it("passes the organization ID when listing suppliers", async () => {
    mockedList.mockResolvedValue([] as never);

    const response = await request(app)
      .get("/api/suppliers?status=ACTIVE")
      .set("x-test-organization-id", "99")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(mockedList).toHaveBeenCalledWith({
      organizationId: 99,
      status: "ACTIVE",
    });
  });

  it("rejects an invalid supplier ID", async () => {
    const response = await request(app)
      .get("/api/suppliers/invalid")
      .expect(400);

    expect(response.body.message).toBe("Invalid supplier ID");
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it("returns 404 when a supplier is not found in the organization", async () => {
    mockedGet.mockRejectedValue(new Error("Supplier not found"));

    const response = await request(app)
      .get("/api/suppliers/10")
      .set("x-test-organization-id", "99")
      .expect(404);

    expect(response.body.message).toBe("Supplier not found");
    expect(mockedGet).toHaveBeenCalledWith({
      supplierId: 10,
      organizationId: 99,
    });
  });

  it("updates a supplier using its ID and organization scope", async () => {
    mockedUpdate.mockResolvedValue({
      id: 10,
      organizationId: 2,
      name: "Updated Supplier",
      code: "SUP-001",
      status: "INACTIVE",
    } as never);

    const response = await request(app)
      .patch("/api/suppliers/10")
      .set("x-test-organization-id", "2")
      .send({
        name: "Updated Supplier",
        status: "INACTIVE",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(mockedUpdate).toHaveBeenCalledWith({
      supplierId: 10,
      organizationId: 2,
      name: "Updated Supplier",
      status: "INACTIVE",
    });
  });
});