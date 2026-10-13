import { Router } from "express"
import {
  create,
  list,
  getById,
  updateById,
  submitForApproval,
} from "../controllers/purchase-requisition.controller"
import { authenticate } from "../middleware/auth.middleware"
import { authorize } from "../middleware/rbac.middleware"

const router = Router()

router.use(authenticate)

router.get("/", list)
router.get("/:id", getById)

router.post(
  "/",
  authorize("SUPER_ADMIN", "ORG_ADMIN", "MANAGER", "EMPLOYEE"),
  create,
)

router.patch(
  "/:id",
  authorize("SUPER_ADMIN", "ORG_ADMIN", "MANAGER", "EMPLOYEE"),
  updateById
)

router.post(
    "/:id/submit",
    authorize("SUPER_ADMIN","ORG_ADMIN","MANAGER","EMPLOYEE"),
    submitForApproval
)

export default router