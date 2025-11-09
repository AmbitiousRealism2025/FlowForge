'use client'

import * as Toast from '@radix-ui/react-toast'
import { X } from 'lucide-react'
import { useToastStore } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, removeToast } = useToastStore()

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          open={toast.open}
          onOpenChange={(open) => {
            if (!open) removeToast(toast.id)
          }}
          className={cn(
            'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all',
            'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
            {
              'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-50':
                toast.type === 'success',
              'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-50':
                toast.type === 'error',
              'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-50':
                toast.type === 'warning',
              'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-50':
                toast.type === 'info',
            }
          )}
        >
          <div className="flex flex-col gap-1">
            {toast.title && (
              <Toast.Title className="text-sm font-semibold">
                {toast.title}
              </Toast.Title>
            )}
            <Toast.Description className="text-sm opacity-90">
              {toast.message}
            </Toast.Description>
          </div>
          <Toast.Close className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-black/10 group-hover:opacity-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </Toast.Provider>
  )
}
