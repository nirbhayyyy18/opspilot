import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { authorize } from "../middleware/rbac.middleware"
import { create, list, getById, updateById } from "../controllers/task.controller"

const router = Router()

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN", "ORG_ADMIN", "MANAGER"),
  create,
)

router.get(
    "/",
    authenticate,
    list,
)

router.get(
    "/:id",
    authenticate,
    getById,
)

router.patch(
    "/:id",
    authenticate,
    authorize("SUPER_ADMIN","ORG_ADMIN","MANAGER"),
    updateById,
)

export default router