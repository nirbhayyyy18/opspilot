import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { authorize } from "../middleware/rbac.middleware"
import { create, createStep } from "../controllers/workflow.controller"

const router = Router()

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ORG_ADMIN", "MANAGER"),
  create,
)

router.post(
    "/:workflowId/steps",
    authenticate,
    authorize("SUPER_ADMIN","ORG_ADMIN","MANAGER"),
    createStep,
)

export default router