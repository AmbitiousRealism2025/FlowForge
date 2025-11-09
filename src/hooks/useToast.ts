'use client'

import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  title?: string
  type: ToastType
  open: boolean
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type: ToastType, title?: string, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type, title, duration = 5000) => {
    const id = Math.random().toString(36).substring(7)

    set((state) => ({
      toasts: [...state.toasts, { id, message, title, type, open: true, duration }],
    }))

    // Auto-dismiss after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map((toast) =>
          toast.id === id ? { ...toast, open: false } : toast
        ),
      }))

      // Remove from array after animation
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }))
      }, 300)
    }, duration)
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((toast) =>
        toast.id === id ? { ...toast, open: false } : toast
      ),
    }))

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }))
    }, 300)
  },
}))

export function useToast() {
  const { addToast } = useToastStore()

  return {
    toast: {
      success: (message: string, title?: string) => addToast(message, 'success', title),
      error: (message: string, title?: string) => addToast(message, 'error', title),
      info: (message: string, title?: string) => addToast(message, 'info', title),
      warning: (message: string, title?: string) => addToast(message, 'warning', title),
    },
  }
}
