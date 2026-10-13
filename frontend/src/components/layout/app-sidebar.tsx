"use client"

import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  Boxes,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Users,
  Workflow,
  Zap,
} from "lucide-react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        title: "Tasks",
        href: "/tasks",
        icon: ClipboardList,
      },
      {
        title: "Approvals",
        href: "/approvals",
        icon: ClipboardCheck,
      },
      {
        title: "Workflows",
        href: "/workflows",
        icon: Workflow,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Purchases",
        href: "/purchases",
        icon: ShoppingCart,
      },
      {
        title: "Inventory",
        href: "/inventory",
        icon: Boxes,
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        icon: Users,
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
      {
        title: "Analytics",
        href: "/analytics",
        icon: FileBarChart,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-2"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              OpsPilot
            </span>

            <span className="text-xs text-muted-foreground">
              Operations Platform
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>
              {group.title}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`)

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={{ children: item.title }}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={
                pathname === "/settings" ||
                pathname.startsWith("/settings/")
              }
              tooltip={{ children: "Settings" }}
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}