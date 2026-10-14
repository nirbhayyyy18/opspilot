"use client"

import { Bell, Search, LogOut, UserRound, Building2 } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/auth-provider"

function formatRole(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ")
}

export function AppTopbar() {
  const { user, organization, logout } = useAuth()

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Workspace User"

  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((name) => name?.[0] ?? "")
      .join("")
      .toUpperCase() || "U"

  const role = user ? formatRole(user.role) : "Workspace User"

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        <div className="hidden items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 md:flex">
          <Search className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Search anything...
          </span>
          <kbd className="ml-8 rounded border bg-background px-1.5 py-0.5 text-xs text-muted-foreground">
            Ctrl K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
                aria-label="Open account menu"
              />
            }
          >
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="hidden text-left md:block">
              <p className="max-w-44 truncate text-sm font-medium">
                {fullName}
              </p>
              <p className="max-w-44 truncate text-xs text-muted-foreground">
                {organization?.name ?? role}
              </p>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p>{fullName}</p>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  {user?.email ?? "No email available"}
                </p>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  {role}
                </p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled>
              <UserRound className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem disabled>
              <Building2 className="mr-2 size-4" />
              {organization?.name ?? "Organization"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => void logout()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}