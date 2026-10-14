import cors from "cors"
import express from "express"
import helmet from "helmet"
import { protectCookieRequests } from "./middleware/csrf.middleware"
import authRoutes from "./routes/auth.routes"
import userRoutes from "./routes/user.routes"
import organizationRoutes from "./routes/organization.routes"
import taskRoutes from "./routes/task.routes"
import workflowRoutes from "./routes/workflow.routes"
import approvalRoutes from "./routes/approval.routes"
import supplierRoutes from "./routes/supplier.routes"
import purchaseRequisitionRoutes from "./routes/purchase-requisition.routes"
import cookieParser from "cookie-parser"


const app = express()

app.use(helmet())

app.use(cookieParser())

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api",protectCookieRequests)

app.use("/api/auth", authRoutes)

app.use("/api/users", userRoutes)

app.use("/api/organizations",organizationRoutes)

app.use("/api/tasks",taskRoutes)

app.use("/api/workflows",workflowRoutes)

app.use("/api/approval-requests",approvalRoutes)

app.use("/api/suppliers",supplierRoutes)

app.use("/api/purchase-requisitions",purchaseRequisitionRoutes)

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "OpsPilot API is running",
    timestamp: new Date().toISOString(),
  })
})

export default app