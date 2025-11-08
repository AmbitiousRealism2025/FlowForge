import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from '@/components/providers/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FlowForge - AI Productivity Companion',
  description: 'Track flow states, AI context health, and shipping velocity for vibe coding developers',
  manifest: '/manifest.json',
  themeColor: '#00D9A5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FlowForge',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
