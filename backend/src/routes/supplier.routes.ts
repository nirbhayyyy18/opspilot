import { Router } from "express"
import {
  create,
  list,
  getById,
  updateById,
} from "../controllers/supplier.controller"
import { authenticate } from "../middleware/auth.middleware"
import { authorize } from "../middleware/rbac.middleware"

const router = Router()

router.use(authenticate)

router.get("/", list)
router.get("/:id", getById)

router.post(
  "/",
  authorize("SUPER_ADMIN", "ORG_ADMIN", "MANAGER"),
  create,
)

router.patch(
  "/:id",
  authorize("SUPER_ADMIN", "ORG_ADMIN", "MANAGER"),
  updateById,
)

export default router