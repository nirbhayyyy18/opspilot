import { Router } from "express"
import {
  authenticate,
} from "../middleware/auth.middleware"
import {
  authorize,
} from "../middleware/rbac.middleware"
import {
  createMember,
} from "../controllers/organization.controller"

const router = Router()

router.post(
  "/members",
  authenticate,
  authorize("ORG_ADMIN"),
  createMember,
)

export default router