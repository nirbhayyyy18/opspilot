import { Router } from "express"
import {
    getSession,
    login,
    logout,
    register,
 } from "../controllers/auth.controller"
import {
    protectCookieRequests,
    validateBrowserOrigin,
} from "../middleware/csrf.middleware"

const router = Router()

router.use(validateBrowserOrigin)

router.post("/register", register)
router.post("/login",login)
router.post("/logout",protectCookieRequests, logout)
router.get("/me",getSession)

export default router
