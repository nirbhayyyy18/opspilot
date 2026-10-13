import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Package,
  Plus,
  ShoppingCart,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const stats = [
  {
    title: "Open Tasks",
    value: "32",
    change: "+12%",
    description: "vs. last week",
    icon: ClipboardCheck,
  },
  {
    title: "Pending Approvals",
    value: "17",
    change: "-8%",
    description: "vs. last week",
    icon: Clock3,
  },
  {
    title: "Low Stock Items",
    value: "8",
    change: "+3",
    description: "need attention",
    icon: Package,
  },
  {
    title: "Active Operations",
    value: "24",
    change: "+6%",
    description: "across 4 departments",
    icon: Activity,
  },
]

const activities = [
  {
    title: "Purchase Order #PO-1042 approved",
    description: "Approved by Operations Manager",
    time: "12 min ago",
    icon: CheckCircle2,
  },
  {
    title: "New inventory item received",
    description: "Steel Coil · 2,500 KG",
    time: "34 min ago",
    icon: Package,
  },
  {
    title: "Task assigned to Procurement",
    description: "Supplier verification required",
    time: "1 hr ago",
    icon: ClipboardCheck,
  },
  {
    title: "New supplier added",
    description: "Shree Metals & Industries",
    time: "2 hrs ago",
    icon: Users,
  },
]

const alerts = [
  {
    item: "CR Coil 2.5mm",
    stock: "120 KG",
    minimum: "500 KG",
  },
  {
    item: "MS Sheet 4mm",
    stock: "85 PCS",
    minimum: "200 PCS",
  },
  {
    item: "GI Coil 1.6mm",
    stock: "210 KG",
    minimum: "400 KG",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Overview
          </p>

          <h1 className="text-2xl font-semibold tracking-tight">
            Operations Dashboard
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your organization&apos;s operations and activity.
          </p>
        </div>

        <div className="flex gap-2">
          <button className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
            <BarChart3 className="size-4" />
            View Reports
          </button>

          <button className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            <Plus className="size-4" />
            Create Task
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Card key={stat.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                  </div>

                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span className="font-medium text-foreground">
                    {stat.change}
                  </span>

                  <span className="text-muted-foreground">
                    {stat.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Operations Overview */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Operations Overview</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Current operational activity across your organization.
                </p>
              </div>

              <Activity className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-muted-foreground" />

                  <span className="text-sm font-medium">
                    Purchases
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold">
                  18
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  6 awaiting approval
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />

                  <span className="text-sm font-medium">
                    Inventory
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold">
                  1,284
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  8 items below threshold
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="size-4 text-muted-foreground" />

                  <span className="text-sm font-medium">
                    Approvals
                  </span>
                </div>

                <p className="mt-3 text-2xl font-semibold">
                  17
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  5 require your attention
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
              <BarChart3 className="mx-auto size-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">
                Operational analytics
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Interactive charts will be connected to live business data.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {[
              {
                title: "Create Purchase Request",
                icon: ShoppingCart,
              },
              {
                title: "Create Task",
                icon: ClipboardCheck,
              },
              {
                title: "Add Inventory Item",
                icon: Package,
              },
              {
                title: "Add Supplier",
                icon: Users,
              },
            ].map((action) => {
              const Icon = action.icon

              return (
                <button
                  key={action.title}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4" />
                    </div>

                    <span className="text-sm font-medium">
                      {action.title}
                    </span>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground" />
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>

              <button className="text-xs font-medium text-muted-foreground hover:text-foreground">
                View all
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-5">
              {activities.map((activity) => {
                const Icon = activity.icon

                return (
                  <div
                    key={activity.title}
                    className="flex gap-3"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {activity.title}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inventory Alerts</CardTitle>

              <AlertTriangle className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.item}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {alert.item}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Minimum: {alert.minimum}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {alert.stock}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Available
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}