import { Router } from "express"
import { authenticate } from "../middleware/auth.middleware"
import { create, processAction, list, getById } from "../controllers/approval.controller"

const router = Router()

router.get(
    "/",
    authenticate,
    list,
)

router.post(
  "/",
  authenticate,
  create,
)

router.get(
    "/:id",
    authenticate,
    getById,
)

router.post(
    "/:id/action",
    authenticate,
    processAction,
)

export default router