'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Clock, FolderKanban, StickyNote, BarChart3 } from 'lucide-react'
import { UserMenu } from './UserMenu'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Sessions',
    href: '/sessions',
    icon: Clock,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: StickyNote,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo/Brand */}
      <div className="flex items-center gap-2 border-b p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D9A5] text-white font-bold">
          F
        </div>
        <span className="text-xl font-bold" style={{ color: '#00D9A5' }}>
          FlowForge
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-accent',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Menu at Bottom */}
      <div className="mt-auto border-t">
        <UserMenu />
      </div>
    </div>
  )
}
