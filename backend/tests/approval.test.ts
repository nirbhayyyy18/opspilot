import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("../src/services/approval.service", () => ({
  createApprovalRequest: vi.fn(),
  processApprovalAction: vi.fn(),
  listApprovalRequests: vi.fn(),
  getApprovalRequest: vi.fn(),
}));

vi.mock("../src/middleware/auth.middleware", () => ({
  authenticate: (
    req: any,
    _res: any,
    next: any,
  ) => {
    const organizationId = Number(
      req.headers["x-test-organization-id"] ?? 2,
    );

    const role = String(
      req.headers["x-test-role"] ?? "EMPLOYEE",
    );

    req.user = {
      userId: 101,
      organizationId,
      role,
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
  createApprovalRequest,
  processApprovalAction,
  listApprovalRequests,
  getApprovalRequest,
} from "../src/services/approval.service";

const mockedCreate = vi.mocked(createApprovalRequest);
const mockedProcess = vi.mocked(processApprovalAction);
const mockedList = vi.mocked(listApprovalRequests);
const mockedGetById = vi.mocked(getApprovalRequest);

afterEach(() => {
  vi.resetAllMocks();
});

describe("Approval Request API", () => {
  it("rejects creation when workflowId is missing", async () => {
    const response = await request(app)
      .post("/api/approval-requests")
      .send({ title: "Purchase approval" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("creates a request using the authenticated organization and user", async () => {
    mockedCreate.mockResolvedValue({
      id: 10,
      status: "PENDING",
    } as never);

    const response = await request(app)
      .post("/api/approval-requests")
      .set("x-test-organization-id", "2")
      .send({
        workflowId: 2,
        title: "Purchase approval",
        description: "Approve steel coil purchase",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(mockedCreate).toHaveBeenCalledWith({
      organizationId: 2,
      requestedBy: 101,
      workflowId: 2,
      title: "Purchase approval",
      description: "Approve steel coil purchase",
    });
  });

  it("returns 400 for an invalid approval request ID", async () => {
    const response = await request(app)
      .get("/api/approval-requests/invalid")
      .expect(400);

    expect(response.body.message).toBe(
      "Invalid approval request ID",
    );
    expect(mockedGetById).not.toHaveBeenCalled();
  });

  it("passes the authenticated organization when fetching a request", async () => {
    mockedGetById.mockResolvedValue({
      id: 10,
      status: "PENDING",
    } as never);

    const response = await request(app)
      .get("/api/approval-requests/10")
      .set("x-test-organization-id", "99")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(mockedGetById).toHaveBeenCalledWith({
      approvalRequestId: 10,
      organizationId: 99,
    });
  });

  it("rejects an invalid approval action", async () => {
    const response = await request(app)
      .post("/api/approval-requests/10/action")
      .send({ action: "DELETE" })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it("passes the authenticated user's role when processing approval", async () => {
    mockedProcess.mockResolvedValue({
      id: 10,
      status: "APPROVED",
    } as never);

    const response = await request(app)
      .post("/api/approval-requests/10/action")
      .set("x-test-organization-id", "2")
      .set("x-test-role", "MANAGER")
      .send({
        action: "APPROVE",
        comment: "Looks good",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(mockedProcess).toHaveBeenCalledWith({
      approvalRequestId: 10,
      organizationId: 2,
      userId: 101,
      role: "MANAGER",
      action: "APPROVE",
      comment: "Looks good",
    });
  });

  it("returns 409 when the request is no longer pending", async () => {
    mockedProcess.mockRejectedValue(
      new Error("Approval request is not pending"),
    );

    const response = await request(app)
      .post("/api/approval-requests/10/action")
      .send({ action: "APPROVE" })
      .expect(409);

    expect(response.body.message).toBe(
      "Approval request is not pending",
    );
  });
});