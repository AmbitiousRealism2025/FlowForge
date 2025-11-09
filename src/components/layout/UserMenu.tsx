'use client'

import { useSession, signOut } from 'next-auth/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react'

export function UserMenu() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 p-4 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded mb-1" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const user = session.user
  const displayName = user.name || user.email || 'User'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar.Root className="h-10 w-10">
            <Avatar.Image
              src={user.image || undefined}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
            <Avatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {initials}
            </Avatar.Fallback>
          </Avatar.Root>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[240px] rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
          sideOffset={8}
          align="start"
        >
          <DropdownMenu.Label className="px-3 py-2 text-sm font-semibold">
            My Account
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item className="flex items-center gap-3 rounded-md px-3 py-2 text-sm outline-none cursor-pointer hover:bg-accent focus:bg-accent">
            <User className="h-4 w-4" />
            <span>Profile & Settings</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item className="flex items-center gap-3 rounded-md px-3 py-2 text-sm outline-none cursor-pointer hover:bg-accent focus:bg-accent">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Documentation</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive outline-none cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10"
            onSelect={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
