import { afterEach, describe, expect, it, vi } from "vitest"
import request from "supertest"

vi.mock("../src/services/purchase-requisition.service", () => ({
  createPurchaseRequisition: vi.fn(),
  listPurchaseRequisitions: vi.fn(),
  getPurchaseRequisition: vi.fn(),
  updatePurchaseRequisition: vi.fn(),
  submitPurchaseRequisition: vi.fn(),
}))

vi.mock("../src/middleware/auth.middleware", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../src/middleware/auth.middleware")>()

  return {
    ...actual,
    authenticate: (req: any, _res: any, next: any) => {
      const organizationId = Number(req.headers["x-test-organization-id"])

      if (!organizationId) {
        return next()
      }

      req.user = {
        userId: 101,
        organizationId,
        role: "EMPLOYEE",
      }

      next()
    },
  }
})

import app from "../src/app"
import {
  createPurchaseRequisition,
  getPurchaseRequisition,
  submitPurchaseRequisition,
  updatePurchaseRequisition,
} from "../src/services/purchase-requisition.service"

afterEach(() => {
  vi.resetAllMocks()
})

const validRequisition = {
  title: "Steel Coil Purchase",
  reason: "Inventory replenishment",
  items: [
    {
      itemName: "Hot Rolled Steel Coil",
      description: "Standard grade",
      quantity: 10,
      unit: "KG",
      estimatedUnitPrice: 75.5,
    },
  ],
}

describe("Purchase Requisition API", () => {
  it("rejects a requisition without items", async () => {
    const response = await request(app)
      .post("/api/purchase-requisitions")
      .set("x-test-organization-id", "2")
      .send({
        title: "Steel Coil Purchase",
        items: [],
      })
      .expect(400)

    expect(response.body.success).toBe(false)
    expect(response.body.message).toBe("Validation failed")
    expect(vi.mocked(createPurchaseRequisition)).not.toHaveBeenCalled()
  })

  it("creates a requisition using the authenticated organization and user", async () => {
    vi.mocked(createPurchaseRequisition).mockResolvedValue({
      id: 10,
      organizationId: 2,
      requestedBy: 101,
      status: "DRAFT",
      ...validRequisition,
    } as never)

    const response = await request(app)
      .post("/api/purchase-requisitions")
      .set("x-test-organization-id", "2")
      .send(validRequisition)
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(createPurchaseRequisition).toHaveBeenCalledWith({
      organizationId: 2,
      requestedBy: 101,
      ...validRequisition,
    })
  })

  it("returns 404 when a requisition is not found in the current organization", async () => {
    vi.mocked(getPurchaseRequisition).mockRejectedValue(
      new Error("Purchase requisition not found"),
    )

    const response = await request(app)
      .get("/api/purchase-requisitions/10")
      .set("x-test-organization-id", "99")
      .expect(404)

    expect(response.body.message).toBe("Purchase requisition not found")
    expect(getPurchaseRequisition).toHaveBeenCalledWith({
      requisitionId: 10,
      organizationId: 99,
    })
  })

  it("rejects submission when workflowId is invalid", async () => {
    const response = await request(app)
      .post("/api/purchase-requisitions/10/submit")
      .set("x-test-organization-id", "2")
      .send({ workflowId: -1 })
      .expect(400)

    expect(response.body.message).toBe("Validation failed")
    expect(vi.mocked(submitPurchaseRequisition)).not.toHaveBeenCalled()
  })

  it("submits a requisition using the authenticated organization and user", async () => {
    vi.mocked(submitPurchaseRequisition).mockResolvedValue({
      message: "Purchase requisition submitted for approval successfully",
      requisitionId: 10,
      requisitionNumber: "PR-2-TEST",
      approvalRequest: {
        id: 20,
        organizationId: 2,
        workflowId: 2,
        requestedBy: 101,
        currentStep: 1,
        status: "PENDING",
      },
    } as never)

    const response = await request(app)
      .post("/api/purchase-requisitions/10/submit")
      .set("x-test-organization-id", "2")
      .send({ workflowId: 2 })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(submitPurchaseRequisition).toHaveBeenCalledWith({
      requisitionId: 10,
      organizationId: 2,
      requestedBy: 101,
      workflowId: 2,
    })
  })

  it("returns 403 when the service rejects editing another user's requisition", async () => {
    vi.mocked(updatePurchaseRequisition).mockRejectedValue(
      new Error("You can only edit your own requisitions"),
    )

    const response = await request(app)
      .patch("/api/purchase-requisitions/10")
      .set("x-test-organization-id", "2")
      .send({ title: "Changed title" })
      .expect(403)

    expect(response.body.message).toBe(
      "You can only edit your own requisitions",
    )
  })
})