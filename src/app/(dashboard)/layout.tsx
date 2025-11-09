import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { Toaster } from '@/components/ui/Toaster'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="pb-20 md:pb-0 md:pl-64">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden">
        <MobileNav />
      </nav>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}
