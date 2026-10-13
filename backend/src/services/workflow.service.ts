import { db } from "../prisma/db"

interface CreateWorkflowInput {
  organizationId: number
  name: string
  description?: string | undefined
}

export async function createWorkflow(input: CreateWorkflowInput) {
  const organization = await db.orm.public.Organization
    .where({ id: input.organizationId })
    .select("id", "status")
    .first()

  if (!organization) {
    throw new Error("Organization not found")
  }

  if (organization.status !== "ACTIVE") {
    throw new Error("Organization is not active")
  }

  const workflow = await db.orm.public.Workflow.create({
    organizationId: input.organizationId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
  })

  return workflow
}

interface CreateWorkflowStepInput {
  workflowId: number
  organizationId: number
  stepOrder: number
  name: string
  approverRole: "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER"
}

export async function createWorkflowStep(
  input: CreateWorkflowStepInput,
) {
  const workflow = await db.orm.public.Workflow
    .where({
      id: input.workflowId,
      organizationId: input.organizationId,
    })
    .select(
      "id",
      "organizationId",
      "isActive",
    )
    .first()

  if (!workflow) {
    throw new Error("Workflow not found")
  }

  if (!workflow.isActive) {
    throw new Error("Workflow is not active")
  }

  const existingStep = await db.orm.public.WorkflowStep
    .where({
      workflowId: input.workflowId,
      stepOrder: input.stepOrder,
    })
    .select("id")
    .first()

  if (existingStep) {
    throw new Error("Workflow step with this order already exists")
  }

  const step = await db.orm.public.WorkflowStep.create({
    workflowId: input.workflowId,
    stepOrder: input.stepOrder,
    name: input.name.trim(),
    approverRole: input.approverRole,
  })

  return step
}